// web-pwa/js/synchronization/background-sync.js
// Sinkronisasi terjadwal (bukan real-time) buat hemat baterai & kuota

export class BackgroundSync {
  constructor() {
    this.isRunning = false;
    this.intervalId = null;
    this.queue = [];
    this.syncMode = localStorage.getItem('syncMode') || 'every-1-hour';
    this.init();
  }

  init() {
    // Dengarkan perubahan mode sync
    window.addEventListener('syncModeChange', (event) => {
      this.syncMode = event.detail.mode;
      this.restart();
    });

    // Pantau online/offline
    window.addEventListener('online', () => {
      console.log('[SYNC] Online, mulai sync...');
      this.sync();
    });

    window.addEventListener('offline', () => {
      console.log('[SYNC] Offline, sync ditunda');
    });

    this.start();
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;

    const interval = this.getInterval();
    this.intervalId = setInterval(() => {
      this.sync();
    }, interval);

    console.log('[SYNC] Started with interval:', interval, 'ms');
  }

  restart() {
    this.stop();
    this.start();
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
  }

  getInterval() {
    const intervals = {
      'real-time': 5000,
      'every-1-minute': 60000,
      'every-5-minutes': 300000,
      'every-1-hour': 3600000,
      'every-6-hours': 21600000,
      'off': -1
    };
    return intervals[this.syncMode] || intervals['every-1-hour'];
  }

  async sync() {
    if (!navigator.onLine) {
      console.log('[SYNC] Offline, sync skipped');
      return;
    }

    console.log('[SYNC] Syncing...');

    try {
      // 1. Sync laporan
      await this.syncReports();

      // 2. Sync stok
      await this.syncStok();

      // 3. Sync transaksi
      await this.syncTransactions();

      // 4. Sync barter
      await this.syncBarter();

      console.log('[SYNC] Sync complete');
    } catch (error) {
      console.error('[SYNC] Error:', error);
    }
  }

  async syncReports() {
    // Ambil laporan dari IndexedDB yang belum di-sync
    const reports = await this.getUnsyncedReports();
    if (reports.length === 0) return;

    // Kirim ke Supabase
    for (const report of reports) {
      try {
        await this.sendToSupabase('reports', report);
        await this.markAsSynced(report.id);
      } catch (error) {
        console.error('[SYNC] Gagal sync laporan:', report.id, error);
      }
    }
  }

  async syncStok() {
    // Sync data stok
    const stok = await this.getStok();
    if (stok) {
      try {
        await this.sendToSupabase('stok', stok);
      } catch (error) {
        console.error('[SYNC] Gagal sync stok:', error);
      }
    }
  }

  async syncTransactions() {
    // Sync transaksi kasir
    const transactions = await this.getUnsyncedTransactions();
    for (const tx of transactions) {
      try {
        await this.sendToSupabase('transactions', tx);
        await this.markAsSynced(tx.id);
      } catch (error) {
        console.error('[SYNC] Gagal sync transaksi:', tx.id, error);
      }
    }
  }

  async syncBarter() {
    // Sync transaksi barter
    const barter = await this.getUnsyncedBarter();
    for (const b of barter) {
      try {
        await this.sendToSupabase('barter', b);
        await this.markAsSynced(b.id);
      } catch (error) {
        console.error('[SYNC] Gagal sync barter:', b.id, error);
      }
    }
  }

  // Helper: IndexedDB functions
  getUnsyncedReports() {
    return new Promise((resolve) => {
      const db = indexedDB.open('SembakoDB', 1);
      db.onsuccess = () => {
        const tx = db.result.transaction('reports', 'readonly');
        const store = tx.objectStore('reports');
        const request = store.getAll();
        request.onsuccess = () => {
          resolve(request.result.filter(r => !r.synced));
        };
        request.onerror = () => resolve([]);
      };
      db.onerror = () => resolve([]);
    });
  }

  getStok() {
    return new Promise((resolve) => {
      const stok = localStorage.getItem('stokData');
      resolve(stok ? JSON.parse(stok) : null);
    });
  }

  getUnsyncedTransactions() {
    return new Promise((resolve) => {
      const db = indexedDB.open('SembakoDB', 1);
      db.onsuccess = () => {
        const tx = db.result.transaction('transactions', 'readonly');
        const store = tx.objectStore('transactions');
        const request = store.getAll();
        request.onsuccess = () => {
          resolve(request.result.filter(t => !t.synced));
        };
        request.onerror = () => resolve([]);
      };
      db.onerror = () => resolve([]);
    });
  }

  getUnsyncedBarter() {
    return new Promise((resolve) => {
      const db = indexedDB.open('SembakoDB', 1);
      db.onsuccess = () => {
        const tx = db.result.transaction('barter', 'readonly');
        const store = tx.objectStore('barter');
        const request = store.getAll();
        request.onsuccess = () => {
          resolve(request.result.filter(b => !b.synced));
        };
        request.onerror = () => resolve([]);
      };
      db.onerror = () => resolve([]);
    });
  }

  sendToSupabase(table, data) {
    // Implementasi pengiriman ke Supabase
    return new Promise((resolve, reject) => {
      // Panggil supabase client
      if (window.supabase) {
        window.supabase.from(table).insert(data)
          .then(resolve)
          .catch(reject);
      } else {
        reject('Supabase tidak tersedia');
      }
    });
  }

  markAsSynced(id) {
    return new Promise((resolve) => {
      const db = indexedDB.open('SembakoDB', 1);
      db.onsuccess = () => {
        const tx = db.result.transaction('reports', 'readwrite');
        const store = tx.objectStore('reports');
        const request = store.get(id);
        request.onsuccess = () => {
          const data = request.result;
          if (data) {
            data.synced = true;
            store.put(data);
          }
          resolve();
        };
        request.onerror = () => resolve();
      };
      db.onerror = () => resolve();
    });
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      syncMode: this.syncMode,
      interval: this.getInterval(),
      queueLength: this.queue.length
    };
  }
}
