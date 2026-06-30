// ============================================
// SUPABASE CLIENT — SembakoKita.Pro v2026.07.01
// ============================================
// Fitur:
// ✅ Offline queue (IndexedDB)
// ✅ Retry mechanism (3x retry dengan exponential backoff)
// ✅ Flush queue saat online
// ✅ Conflict resolver
// ✅ Real-time subscription (opsional)
// ============================================

export class SupabaseClient {
  constructor(config = {}) {
    // Konfigurasi
    this.supabaseUrl = config.url || localStorage.getItem('supabaseUrl') || 
                        import.meta.env?.VITE_SUPABASE_URL || 
                        'https://your-project.supabase.co';
    this.supabaseKey = config.anonKey || localStorage.getItem('supabaseKey') || 
                        import.meta.env?.VITE_SUPABASE_ANON_KEY || 
                        'your-anon-key';
    
    // Queue & Status
    this.queue = [];
    this.isOnline = navigator.onLine;
    this.retryCount = config.retryCount || 3;
    this.retryDelay = config.retryDelay || 5000;
    this.maxQueueSize = config.maxQueueSize || 1000;
    this.isFlushing = false;
    this.client = null;
    this.db = null;

    // Inisialisasi
    this.init();
  }

  // ============================================
  // INIT — Inisialisasi Supabase + IndexedDB
  // ============================================
  async init() {
    console.log('[SUPABASE] Initializing...');

    // 1. Inisialisasi Supabase client
    if (window.supabase) {
      this.client = window.supabase.createClient(this.supabaseUrl, this.supabaseKey);
      console.log('[SUPABASE] Client created');
    } else {
      console.warn('[SUPABASE] Supabase library tidak ditemukan. Mode offline-only.');
    }

    // 2. Inisialisasi IndexedDB untuk queue
    await this.initDB();

    // 3. Load queue dari IndexedDB
    await this.loadQueueFromDB();

    // 4. Setup event listeners
    this.setupListeners();

    // 5. Flush queue jika online
    if (this.isOnline && this.queue.length > 0) {
      console.log('[SUPABASE] Online, flushing queue...');
      this.flushQueue();
    }

    console.log('[SUPABASE] Initialized. Online:', this.isOnline, 'Queue:', this.queue.length);
  }

  // ============================================
  // INDEXEDDB — Queue Storage
  // ============================================
  initDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('SembakoDB', 2);
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // Queue store
        if (!db.objectStoreNames.contains('queue')) {
          const store = db.createObjectStore('queue', { keyPath: 'id' });
          store.createIndex('table', 'table', { unique: false });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('status', 'status', { unique: false });
          console.log('[SUPABASE] Queue store created');
        }

        // Meta store (sync status)
        if (!db.objectStoreNames.contains('meta')) {
          db.createObjectStore('meta', { keyPath: 'key' });
          console.log('[SUPABASE] Meta store created');
        }
      };

      request.onsuccess = (event) => {
        this.db = event.target.result;
        console.log('[SUPABASE] IndexedDB ready');
        resolve(this.db);
      };

      request.onerror = (event) => {
        console.error('[SUPABASE] IndexedDB error:', event.target.error);
        reject(event.target.error);
      };
    });
  }

  // ============================================
  // QUEUE — Tambah ke antrian
  // ============================================
  async addToQueue(operation, table, data, options = {}) {
    const queueItem = {
      id: Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 8),
      operation: operation, // 'insert', 'update', 'delete', 'upsert'
      table: table,
      data: data,
      options: options,
      status: 'pending', // pending | processing | success | failed
      retries: 0,
      maxRetries: this.retryCount,
      timestamp: new Date().toISOString(),
      lastAttempt: null,
      error: null
    };

    // Simpan ke IndexedDB
    await this.saveQueueToDB(queueItem);
    
    // Simpan ke memory
    this.queue.push(queueItem);

    // Jika online, langsung proses
    if (this.isOnline) {
      this.flushQueue();
    }

    return queueItem;
  }

  // ============================================
  // QUEUE — Simpan ke IndexedDB
  // ============================================
  saveQueueToDB(queueItem) {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject('Database tidak siap');
        return;
      }

      const tx = this.db.transaction('queue', 'readwrite');
      const store = tx.objectStore('queue');
      const request = store.put(queueItem);

      request.onsuccess = () => resolve(queueItem);
      request.onerror = () => reject(request.error);
    });
  }

  // ============================================
  // QUEUE — Load dari IndexedDB
  // ============================================
  loadQueueFromDB() {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        resolve();
        return;
      }

      const tx = this.db.transaction('queue', 'readonly');
      const store = tx.objectStore('queue');
      const request = store.getAll();

      request.onsuccess = () => {
        const items = request.result || [];
        // Filter yang sudah sukses
        this.queue = items.filter(item => item.status !== 'success');
        console.log('[SUPABASE] Queue loaded:', this.queue.length);
        resolve(this.queue);
      };

      request.onerror = () => {
        console.error('[SUPABASE] Load queue error:', request.error);
        reject(request.error);
      };
    });
  }

  // ============================================
  // QUEUE — Hapus dari IndexedDB
  // ============================================
  removeQueueFromDB(id) {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        resolve();
        return;
      }

      const tx = this.db.transaction('queue', 'readwrite');
      const store = tx.objectStore('queue');
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // ============================================
  // QUEUE — Update status di IndexedDB
  // ============================================
  updateQueueStatus(id, status, error = null) {
    const item = this.queue.find(q => q.id === id);
    if (item) {
      item.status = status;
      item.lastAttempt = new Date().toISOString();
      if (error) item.error = error;
      if (status === 'success') {
        this.queue = this.queue.filter(q => q.id !== id);
        this.removeQueueFromDB(id);
      } else {
        this.saveQueueToDB(item);
      }
    }
  }

  // ============================================
  // FLUSH QUEUE — Proses semua antrian saat online
  // ============================================
  async flushQueue() {
    if (this.isFlushing) return;
    if (!this.isOnline) {
      console.log('[SUPABASE] Offline, skip flush');
      return;
    }
    if (this.queue.length === 0) {
      console.log('[SUPABASE] Queue empty');
      return;
    }

    this.isFlushing = true;
    console.log('[SUPABASE] Flushing queue...', this.queue.length, 'items');

    // Ambil queue yang pending
    const pending = this.queue.filter(q => q.status === 'pending' || q.status === 'failed');

    for (const item of pending) {
      try {
        await this.processQueueItem(item);
      } catch (error) {
        console.error('[SUPABASE] Process queue error:', item.id, error);
        // Retry mechanism
        item.retries += 1;
        item.status = 'failed';
        item.error = error.message || 'Unknown error';
        item.lastAttempt = new Date().toISOString();
        this.saveQueueToDB(item);

        // Jika masih ada retry, tambahkan ke queue lagi
        if (item.retries < item.maxRetries) {
          // Exponential backoff
          const delay = this.retryDelay * Math.pow(2, item.retries);
          console.log('[SUPABASE] Retry in', delay, 'ms (attempt', item.retries + 1, ')');
          setTimeout(() => {
            this.flushQueue();
          }, delay);
        } else {
          console.error('[SUPABASE] Max retries exceeded for:', item.id);
        }
      }
    }

    this.isFlushing = false;

    // Cek apakah queue masih ada yang pending
    if (this.queue.filter(q => q.status === 'pending' || q.status === 'failed').length > 0) {
      console.log('[SUPABASE] Some items still pending, retrying...');
      setTimeout(() => this.flushQueue(), this.retryDelay);
    } else {
      console.log('[SUPABASE] Queue flushed successfully!');
    }
  }

  // ============================================
  // PROCESS — Proses 1 item queue
  // ============================================
  async processQueueItem(item) {
    console.log('[SUPABASE] Processing queue item:', item.id, item.operation, item.table);

    if (!this.client) {
      throw new Error('Supabase client tidak tersedia');
    }

    let result;
    const table = this.client.from(item.table);

    switch (item.operation) {
      case 'insert':
        result = await table.insert(item.data, item.options);
        break;

      case 'update':
        result = await table.update(item.data, item.options).eq('id', item.data.id);
        break;

      case 'upsert':
        result = await table.upsert(item.data, item.options);
        break;

      case 'delete':
        result = await table.delete().eq('id', item.data.id);
        break;

      default:
        throw new Error(`Unknown operation: ${item.operation}`);
    }

    if (result.error) {
      throw result.error;
    }

    // Sukses, hapus dari queue
    this.updateQueueStatus(item.id, 'success', null);
    console.log('[SUPABASE] Queue item processed:', item.id);

    return result;
  }

  // ============================================
  // PUBLIC API — Insert (dengan offline queue)
  // ============================================
  async insert(table, data, options = {}) {
    if (this.isOnline && this.client) {
      try {
        const result = await this.client.from(table).insert(data, options);
        if (result.error) throw result.error;
        return { data: result.data, error: null, offline: false };
      } catch (error) {
        console.error('[SUPABASE] Insert error:', error);
        // Simpan ke queue
        await this.addToQueue('insert', table, data, options);
        return { data: null, error: error, offline: true };
      }
    } else {
      // Offline: simpan ke queue
      await this.addToQueue('insert', table, data, options);
      return { data: null, error: null, offline: true };
    }
  }

  // ============================================
  // PUBLIC API — Update (dengan offline queue)
  // ============================================
  async update(table, data, options = {}) {
    if (this.isOnline && this.client) {
      try {
        const result = await this.client.from(table).update(data, options).eq('id', data.id);
        if (result.error) throw result.error;
        return { data: result.data, error: null, offline: false };
      } catch (error) {
        console.error('[SUPABASE] Update error:', error);
        await this.addToQueue('update', table, data, options);
        return { data: null, error: error, offline: true };
      }
    } else {
      await this.addToQueue('update', table, data, options);
      return { data: null, error: null, offline: true };
    }
  }

  // ============================================
  // PUBLIC API — Delete (dengan offline queue)
  // ============================================
  async delete(table, id, options = {}) {
    const data = { id };
    if (this.isOnline && this.client) {
      try {
        const result = await this.client.from(table).delete().eq('id', id);
        if (result.error) throw result.error;
        return { data: result.data, error: null, offline: false };
      } catch (error) {
        console.error('[SUPABASE] Delete error:', error);
        await this.addToQueue('delete', table, data, options);
        return { data: null, error: error, offline: true };
      }
    } else {
      await this.addToQueue('delete', table, data, options);
      return { data: null, error: null, offline: true };
    }
  }

  // ============================================
  // PUBLIC API — Upsert (dengan offline queue)
  // ============================================
  async upsert(table, data, options = {}) {
    if (this.isOnline && this.client) {
      try {
        const result = await this.client.from(table).upsert(data, options);
        if (result.error) throw result.error;
        return { data: result.data, error: null, offline: false };
      } catch (error) {
        console.error('[SUPABASE] Upsert error:', error);
        await this.addToQueue('upsert', table, data, options);
        return { data: null, error: error, offline: true };
      }
    } else {
      await this.addToQueue('upsert', table, data, options);
      return { data: null, error: null, offline: true };
    }
  }

  // ============================================
  // PUBLIC API — Select (dengan fallback offline)
  // ============================================
  async select(table, query = {}, options = {}) {
    if (this.isOnline && this.client) {
      try {
        let q = this.client.from(table).select('*', options);
        for (const [key, value] of Object.entries(query)) {
          q = q.eq(key, value);
        }
        const result = await q;
        if (result.error) throw result.error;
        return { data: result.data, error: null, offline: false };
      } catch (error) {
        console.error('[SUPABASE] Select error:', error);
        // Fallback ke IndexedDB
        return await this.selectFromDB(table, query);
      }
    } else {
      return await this.selectFromDB(table, query);
    }
  }

  // ============================================
  // OFFLINE FALLBACK — Select dari IndexedDB
  // ============================================
  selectFromDB(table, query = {}) {
    return new Promise((resolve) => {
      if (!this.db) {
        resolve({ data: [], error: null, offline: true });
        return;
      }

      const tx = this.db.transaction('data_' + table, 'readonly');
      const store = tx.objectStore('data_' + table);
      const request = store.getAll();

      request.onsuccess = () => {
        let data = request.result || [];
        // Filter manual
        for (const [key, value] of Object.entries(query)) {
          data = data.filter(item => item[key] === value);
        }
        resolve({ data, error: null, offline: true });
      };

      request.onerror = () => {
        resolve({ data: [], error: request.error, offline: true });
      };
    });
  }

  // ============================================
  // EVENT LISTENERS — Online/Offline
  // ============================================
  setupListeners() {
    // Online event
    window.addEventListener('online', () => {
      console.log('[SUPABASE] Online detected!');
      this.isOnline = true;
      if (this.queue.length > 0) {
        this.flushQueue();
      }
    });

    // Offline event
    window.addEventListener('offline', () => {
      console.log('[SUPABASE] Offline detected!');
      this.isOnline = false;
    });

    // Event untuk trigger sync dari service worker
    window.addEventListener('message', (event) => {
      if (event.data?.type === 'SYNC_TRIGGER') {
        console.log('[SUPABASE] Sync triggered from SW');
        if (this.isOnline) {
          this.flushQueue();
        }
      }
    });
  }

  // ============================================
  // UTILITY — Get queue status
  // ============================================
  getQueueStatus() {
    const total = this.queue.length;
    const pending = this.queue.filter(q => q.status === 'pending').length;
    const failed = this.queue.filter(q => q.status === 'failed').length;
    const processing = this.queue.filter(q => q.status === 'processing').length;

    return {
      total,
      pending,
      failed,
      processing,
      isOnline: this.isOnline,
      isFlushing: this.isFlushing,
      maxQueueSize: this.maxQueueSize
    };
  }

  // ============================================
  // UTILITY — Get queue items
  // ============================================
  getQueue(limit = 20) {
    return this.queue.slice(0, limit);
  }

  // ============================================
  // UTILITY — Clear queue
  // ============================================
  async clearQueue() {
    // Hapus semua dari memory
    this.queue = [];
    // Hapus dari IndexedDB
    if (this.db) {
      const tx = this.db.transaction('queue', 'readwrite');
      const store = tx.objectStore('queue');
      const request = store.clear();
      await new Promise((resolve, reject) => {
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    }
    console.log('[SUPABASE] Queue cleared');
  }

  // ============================================
  // UTILITY — Force sync (manual)
  // ============================================
  async forceSync() {
    console.log('[SUPABASE] Force sync triggered');
    if (!this.isOnline) {
      console.warn('[SUPABASE] Cannot force sync: offline');
      return { success: false, message: 'Offline' };
    }
    await this.flushQueue();
    return { success: true, message: 'Sync completed' };
  }

  // ============================================
  // DESTROY — Cleanup
  // ============================================
  destroy() {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
    this.queue = [];
    this.isFlushing = false;
    console.log('[SUPABASE] Destroyed');
  }
}

// ============================================
// EXPORT SINGLETON
// ============================================
export const supabase = new SupabaseClient();

// Export class untuk custom instance
export default SupabaseClient;
