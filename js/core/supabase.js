// web-pwa/js/core/supabase.js
// Supabase client wrapper dengan offline queue & retry

export class SupabaseClient {
  constructor() {
    this.queue = [];
    this.isOnline = navigator.onLine;
    this.retryCount = 3;
    this.retryDelay = 5000;
    this.client = null;
    this.init();
  }

  init() {
    // Inisialisasi Supabase
    const supabaseUrl = localStorage.getItem('supabaseUrl') || 
                        import.meta.env?.VITE_SUPABASE_URL || 
                        'https://your-project.supabase.co';
    const supabaseKey = localStorage.getItem('supabaseKey') || 
                        import.meta.env?.VITE_SUPABASE_ANON_KEY || 
                        'your-anon-key';

    if (window.supabase) {
      this.client = window.supabase.createClient(supabaseUrl, supabaseKey);
    }

    // Pantau koneksi
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.flushQueue();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });

    console.log('[SUPABASE] Initialized, online:', this.isOnline);
  }

  async save(data, table) {
    if (this.isOnline && this.client) {
      try {
        const result = await this.client.from(table).insert(data);
        if (result.error) throw result.error;
        return { data: result.data, error: null };
      } catch (error) {
        console.error('[SUPABASE] Save error:', error);
        // Kalo gagal, masukkan ke queue
        this.queue.push({ data, table, retries: 0 });
        return { data: null, error: error, offline: true };
      }
    } else {
      // Offline: simpan ke queue
      this.queue.push({ data, table, retries: 0 });
      return { data: null, error: null, offline: true };
    }
  }

  async update(data, table, idField = 'id') {
    if (this.isOnline && this.client) {
      try {
        const id = data[idField];
        if (!id) throw new Error('ID tidak ditemukan');
        const result = await this.client.from(table).update(data).eq(idField, id);
        if (result.error) throw result.error;
        return { data: result.data, error: null };
      } catch (error) {
        console.error('[SUPABASE] Update error:', error);
        // Kalo gagal, masukkan ke queue
        this.queue.push({ data, table, operation: 'update', retries: 0 });
        return { data: null, error: error, offline: true };
      }
    } else {
      this.queue.push({ data, table, operation: 'update', retries: 0 });
      return { data: null, error: null, offline: true };
    }
  }

  async delete(table, id, idField = 'id') {
    if (this.isOnline && this.client) {
      try {
        const result = await this.client.from(table).delete().eq(idField, id);
        if (result.error) throw result.error;
        return { data: result.data, error: null };
      } catch (error) {
        console.error('[SUPABASE] Delete error:', error);
        this.queue.push({ data: { [idField]: id }, table, operation: 'delete', retries: 0 });
        return { data: null, error: error, offline: true };
      }
    } else {
      this.queue.push({ data: { [idField]: id }, table, operation: 'delete', retries: 0 });
      return { data: null, error: null, offline: true };
    }
  }

  async get(table, filters = {}) {
    if (!this.isOnline || !this.client) {
      // Offline: ambil dari IndexedDB
      return await this.getFromLocalDB(table, filters);
    }

    try {
      let query = this.client.from(table).select('*');
      for (const [key, value] of Object.entries(filters)) {
        query = query.eq(key, value);
      }
      const result = await query;
      if (result.error) throw result.error;
      return { data: result.data, error: null };
    } catch (error) {
      console.error('[SUPABASE] Get error:', error);
      // Fallback ke IndexedDB
      return await this.getFromLocalDB(table, filters);
    }
  }

  async flushQueue() {
    if (!this.isOnline || !this.client) return;

    console.log('[SUPABASE] Flushing queue:', this.queue.length);
    
    while (this.queue.length > 0) {
      const item = this.queue[0];
      try {
        let result;
        if (item.operation === 'update') {
          result = await this.client.from(item.table).update(item.data).eq('id', item.data.id);
        } else if (item.operation === 'delete') {
          result = await this.client.from(item.table).delete().eq('id', item.data.id);
        } else {
          result = await this.client.from(item.table).insert(item.data);
        }

        if (result.error) throw result.error;
        this.queue.shift(); // Hapus dari queue kalo sukses
      } catch (error) {
        item.retries += 1;
        if (item.retries >= this.retryCount) {
          console.error('[SUPABASE] Retry gagal:', item);
          this.queue.shift(); // Hapus dari queue kalo udah mentok
        } else {
          // Tunggu sebelum retry
          await new Promise(resolve => setTimeout(resolve, this.retryDelay));
          // Jangan shift, coba lagi nanti
          this.queue.push(this.queue.shift()); // Pindah ke belakang
        }
      }
    }
  }

  async getFromLocalDB(table, filters) {
    return new Promise((resolve) => {
      const db = indexedDB.open('SembakoDB', 1);
      db.onsuccess = () => {
        const tx = db.result.transaction(table, 'readonly');
        const store = tx.objectStore(table);
        const request = store.getAll();
        request.onsuccess = () => {
          let data = request.result;
          // Filter manual
          for (const [key, value] of Object.entries(filters)) {
            data = data.filter(item => item[key] === value);
          }
          resolve({ data, error: null });
        };
        request.onerror = () => resolve({ data: [], error: request.error });
      };
      db.onerror = () => resolve({ data: [], error: db.error });
    });
  }

  getQueueLength() {
    return this.queue.length;
  }

  isOnlineStatus() {
    return this.isOnline;
  }
}

// Export singleton
export const supabase = new SupabaseClient();
