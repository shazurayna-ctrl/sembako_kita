// web-pwa/js/synchronization/sync-engine.js
// Engine sinkronisasi utama — mengatur semua sync

import { supabase } from '../core/supabase.js';
import { state } from '../core/state-manager.js';
import { ConflictResolver } from './conflict-resolver.js';
import { BackgroundSync } from './background-sync.js';

export class SyncEngine {
  constructor() {
    this.conflictResolver = new ConflictResolver();
    this.backgroundSync = new BackgroundSync();
    this.isSyncing = false;
    this.lastSync = null;
    this.syncQueue = [];
    this.tables = [
      'reports',
      'transactions',
      'barter',
      'stok',
      'checklist',
      'funding_audit',
      'sos_emergency',
      'warung_darurat'
    ];
    this.init();
  }

  init() {
    console.log('[SYNC] Engine initialized');
    
    // Listen untuk sync trigger
    window.addEventListener('online', () => {
      this.syncAll();
    });

    window.addEventListener('syncModeChange', (event) => {
      this.setMode(event.detail.mode);
    });

    // Auto-sync setiap 1 jam
    setInterval(() => {
      if (navigator.onLine) {
        this.syncAll();
      }
    }, 3600000);
  }

  async syncAll() {
    if (this.isSyncing) return;
    if (!navigator.onLine) {
      console.log('[SYNC] Offline, skip sync');
      return;
    }

    this.isSyncing = true;
    console.log('[SYNC] Starting full sync...');

    try {
      state.set('sync.status', 'syncing');
      
      // Sync semua tabel
      for (const table of this.tables) {
        await this.syncTable(table);
      }

      // Resolve conflicts
      await this.resolveConflicts();

      this.lastSync = new Date().toISOString();
      state.set('sync.lastSync', this.lastSync);
      state.set('sync.status', 'idle');

      console.log('[SYNC] Full sync complete');
      
      // Notifikasi
      window.dispatchEvent(new CustomEvent('syncComplete', {
        detail: { timestamp: this.lastSync }
      }));

    } catch (error) {
      console.error('[SYNC] Error:', error);
      state.set('sync.status', 'error');
    } finally {
      this.isSyncing = false;
    }
  }

  async syncTable(table) {
    console.log(`[SYNC] Syncing table: ${table}`);

    try {
      // Ambil data dari Supabase
      const result = await supabase.select(table);
      if (result.error) throw result.error;

      // Simpan ke IndexedDB / localStorage
      await this.saveToLocal(table, result.data);

      // Kirim data pending ke Supabase
      await this.syncPending(table);

    } catch (error) {
      console.error(`[SYNC] Error syncing ${table}:`, error);
    }
  }

  async syncPending(table) {
    // Ambil data pending dari IndexedDB
    const pending = await this.getPendingFromLocal(table);
    
    for (const item of pending) {
      try {
        await supabase.insert(table, item);
        await this.markAsSynced(table, item.id);
      } catch (error) {
        console.warn(`[SYNC] Failed to sync ${table} item:`, item.id, error);
      }
    }
  }

  async saveToLocal(table, data) {
    try {
      localStorage.setItem(`sync_${table}`, JSON.stringify(data));
    } catch (e) {
      console.warn(`[SYNC] Failed to save ${table} to local:`, e);
    }
  }

  getPendingFromLocal(table) {
    return new Promise((resolve) => {
      try {
        const db = indexedDB.open('SembakoDB', 1);
        db.onsuccess = () => {
          const tx = db.result.transaction(table, 'readonly');
          const store = tx.objectStore(table);
          const request = store.getAll();
          request.onsuccess = () => {
            resolve(request.result.filter(r => !r.synced));
          };
          request.onerror = () => resolve([]);
        };
        db.onerror = () => resolve([]);
      } catch {
        resolve([]);
      }
    });
  }

  markAsSynced(table, id) {
    return new Promise((resolve) => {
      try {
        const db = indexedDB.open('SembakoDB', 1);
        db.onsuccess = () => {
          const tx = db.result.transaction(table, 'readwrite');
          const store = tx.objectStore(table);
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
      } catch {
        resolve();
      }
    });
  }

  async resolveConflicts() {
    // Ambil semua data dari server dan local
    // Bandingkan, resolve conflict
    console.log('[SYNC] Resolving conflicts...');

    for (const table of this.tables) {
      const serverData = await this.getServerData(table);
      const localData = await this.getLocalData(table);

      if (serverData && localData) {
        const conflict = this.conflictResolver.detectConflict(serverData, localData);
        if (conflict.hasConflict) {
          const resolved = this.conflictResolver.autoResolve(serverData, localData, 'server-wins');
          await this.saveToLocal(table, resolved.data);
        }
      }
    }
  }

  async getServerData(table) {
    try {
      const result = await supabase.select(table);
      return result.data;
    } catch {
      return null;
    }
  }

  async getLocalData(table) {
    try {
      const stored = localStorage.getItem(`sync_${table}`);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }

  setMode(mode) {
    const intervals = {
      'real-time': 5000,
      'every-1-minute': 60000,
      'every-5-minutes': 300000,
      'every-1-hour': 3600000,
      'off': -1
    };

    const interval = intervals[mode] || intervals['every-1-hour'];
    console.log('[SYNC] Mode set to:', mode, 'interval:', interval);
  }

  getStatus() {
    return {
      isSyncing: this.isSyncing,
      lastSync: this.lastSync,
      tables: this.tables,
      pending: supabase.getQueueStatus()
    };
  }

  forceSync() {
    return this.syncAll();
  }
}
