export class HealthCheck {
  constructor() {
    this.status = {
      ram: 0,
      battery: 0,
      storage: 0,
      network: false,
      indexedDB: false,
      serviceWorker: false
    };
    this.intervalId = null;
    this.start();
  }

  start() {
    this.intervalId = setInterval(() => {
      this.checkAll();
    }, 60000);
  }

  async checkAll() {
    if (navigator.deviceMemory) {
      this.status.ram = navigator.deviceMemory;
    }

    if (navigator.getBattery) {
      const battery = await navigator.getBattery();
      this.status.battery = Math.round(battery.level * 100);
    }

    if (navigator.storage) {
      const estimate = await navigator.storage.estimate();
      this.status.storage = Math.round(estimate.usage / 1024 / 1024);
    }

    this.status.network = navigator.onLine;
    this.status.indexedDB = await this.checkIndexedDB();
    this.status.serviceWorker = 'serviceWorker' in navigator;

    window.dispatchEvent(new CustomEvent('healthUpdate', {
      detail: { status: this.status }
    }));

    return this.status;
  }

  async checkIndexedDB() {
    try {
      const db = await this.openDB();
      db.close();
      return true;
    } catch {
      return false;
    }
  }

  openDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('SembakoDB', 1);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  getStatus() {
    return this.status;
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}
