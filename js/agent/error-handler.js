// web-pwa/js/agent/error-handler.js
export class ErrorHandler {
  constructor() {
    this.errors = [];
    this.setupGlobalHandler();
  }

  setupGlobalHandler() {
    // Tangkap uncaught error
    window.addEventListener('error', (event) => {
      this.logError({
        type: 'uncaught',
        message: event.message,
        source: event.filename,
        line: event.lineno,
        col: event.colno,
        stack: event.error?.stack,
        time: new Date().toISOString()
      });
      // Tampilkan ke user (tapi gak bikin panik)
      console.warn('[ERROR]', event.message);
    });

    // Tangkap promise rejection
    window.addEventListener('unhandledrejection', (event) => {
      this.logError({
        type: 'unhandled-rejection',
        message: event.reason?.message || event.reason,
        stack: event.reason?.stack,
        time: new Date().toISOString()
      });
      console.warn('[REJECTION]', event.reason);
    });
  }

  logError(error) {
    this.errors.push(error);
    // Simpan ke IndexedDB buat debugging
    this.saveToDB(error);
  }

  async saveToDB(error) {
    try {
      const db = await this.openDB();
      const tx = db.transaction('errors', 'readwrite');
      const store = tx.objectStore('errors');
      await store.add(error);
    } catch (e) {
      console.error('Gagal simpan error:', e);
    }
  }

  openDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('SembakoDB', 1);
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('errors')) {
          db.createObjectStore('errors', { keyPath: 'time' });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  getErrors() {
    return this.errors;
  }
}
