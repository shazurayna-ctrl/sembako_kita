// web-pwa/js/adapters/device-health.js
// Deteksi kemampuan HP: RAM, baterai, Android, storage, suhu

export class DeviceHealth {
  constructor() {
    this.info = {
      ram: 0,
      battery: 0,
      android: 0,
      storage: 0,
      temperature: 0,
      charging: false,
      networkType: 'unknown'
    };
    this.detect();
  }

  async detect() {
    // Deteksi RAM (via navigator.deviceMemory)
    if (navigator.deviceMemory) {
      this.info.ram = navigator.deviceMemory; // GB
    } else {
      this.info.ram = 2; // default buat HP jadul
    }

    // Deteksi Baterai
    if (navigator.getBattery) {
      try {
        const battery = await navigator.getBattery();
        this.info.battery = Math.round(battery.level * 100);
        this.info.charging = battery.charging;
      } catch (e) {
        this.info.battery = 75;
        this.info.charging = false;
      }
    }

    // Deteksi Android (via userAgent)
    const ua = navigator.userAgent;
    const match = ua.match(/Android\s([0-9.]+)/);
    this.info.android = match ? parseFloat(match[1]) : 5;

    // Deteksi Storage (via StorageManager)
    if (navigator.storage) {
      try {
        const estimate = await navigator.storage.estimate();
        this.info.storage = Math.round(estimate.usage / 1024 / 1024); // MB
      } catch (e) {
        this.info.storage = 50;
      }
    }

    // Deteksi Network
    if (navigator.connection) {
      this.info.networkType = navigator.connection.effectiveType || 'unknown';
    }

    return this.info;
  }

  getMode() {
    const { ram, battery, android } = this.info;
    
    // HP sangat tua (Android 5-6, RAM 1GB)
    if (android < 7 || ram < 1.5 || battery < 15) {
      return 'survival';
    }
    
    // HP menengah (Android 7-9, RAM 2GB)
    if (android < 10 || ram < 3 || battery < 30) {
      return 'krisis';
    }
    
    // HP modern
    return 'normal';
  }

  getRecommendation() {
    const mode = this.getMode();
    const recommendations = {
      normal: {
        fitur: ['all'],
        animasi: true,
        sync: 'real-time',
        ui: 'full-color',
        voice: true,
        mesh: true,
        ai: true
      },
      krisis: {
        fitur: ['dashboard', 'kasir', 'stok', 'mesh', 'laporan'],
        animasi: false,
        sync: 'every-1-hour',
        ui: 'minimal',
        voice: false,
        mesh: true,
        ai: false
      },
      survival: {
        fitur: ['laporan', 'sos'],
        animasi: false,
        sync: 'off',
        ui: 'hitam-putih',
        voice: false,
        mesh: false,
        ai: false
      }
    };
    return recommendations[mode];
  }

  isLowBattery() {
    return this.info.battery < 20;
  }

  isCharging() {
    return this.info.charging;
  }

  getStatus() {
    return {
      ...this.info,
      mode: this.getMode(),
      recommendation: this.getRecommendation()
    };
  }
}
