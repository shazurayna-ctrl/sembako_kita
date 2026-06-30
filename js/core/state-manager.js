// web-pwa/js/core/state-manager.js
// Manajemen state aplikasi

export class StateManager {
  constructor() {
    this.state = {
      user: null,
      mode: 'normal',
      deviceInfo: {},
      stok: {},
      reports: [],
      transactions: [],
      barter: [],
      mesh: {
        nodes: [],
        active: false
      },
      sync: {
        status: 'idle',
        lastSync: null
      },
      ui: {
        sidebarOpen: true,
        currentPage: 'dashboard',
        theme: 'light'
      }
    };
    this.listeners = [];
    this.loadFromStorage();
  }

  // 🔥 Set state
  set(key, value) {
    const keys = key.split('.');
    let current = this.state;
    for (let i = 0; i < keys.length - 1; i++) {
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;
    this.saveToStorage();
    this.notifyListeners(key, value);
  }

  // 🔥 Get state
  get(key) {
    const keys = key.split('.');
    let current = this.state;
    for (const k of keys) {
      if (current === undefined) return undefined;
      current = current[k];
    }
    return current;
  }

  // 🔥 Get seluruh state
  getAll() {
    return this.state;
  }

  // 🔥 Subscribe perubahan state
  subscribe(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  notifyListeners(key, value) {
    for (const listener of this.listeners) {
      listener(key, value, this.state);
    }
  }

  // 💾 Simpan ke localStorage
  saveToStorage() {
    try {
      localStorage.setItem('sembakoState', JSON.stringify(this.state));
    } catch (e) {
      console.warn('[STATE] Gagal simpan ke localStorage:', e);
    }
  }

  // 📂 Load dari localStorage
  loadFromStorage() {
    try {
      const saved = localStorage.getItem('sembakoState');
      if (saved) {
        const parsed = JSON.parse(saved);
        this.state = { ...this.state, ...parsed };
      }
    } catch (e) {
      console.warn('[STATE] Gagal load dari localStorage:', e);
    }
  }

  // 🔄 Reset state
  reset() {
    this.state = {
      user: null,
      mode: 'normal',
      deviceInfo: {},
      stok: {},
      reports: [],
      transactions: [],
      barter: [],
      mesh: { nodes: [], active: false },
      sync: { status: 'idle', lastSync: null },
      ui: { sidebarOpen: true, currentPage: 'dashboard', theme: 'light' }
    };
    this.saveToStorage();
    this.notifyListeners('*', null);
  }

  // 📊 Debug state
  debug() {
    console.log('[STATE] Current state:', this.state);
    return this.state;
  }
}

export const state = new StateManager();
