// web-pwa/js/adapters/module-manager.js
// Manajemen modul: hidup/mati fitur otomatis berdasarkan kondisi HP

import { DeviceHealth } from './device-health.js';

export class ModuleManager {
  constructor() {
    this.device = new DeviceHealth();
    this.activeModules = [];
    this.availableModules = [
      'dashboard',
      'kasir',
      'stok',
      'barter',
      'checklist',
      'laporan',
      'pendanaan',
      'logistik',
      'mesh',
      'ledger',
      'ai',
      'keamanan'
    ];
    this.init();
  }

  async init() {
    await this.device.detect();
    const mode = this.device.getMode();
    const rec = this.device.getRecommendation();
    this.activeModules = rec.fitur;
    this.apply();
    console.log('[MODULE] Mode:', mode, 'Aktif:', this.activeModules);
  }

  apply() {
    // Sembunyikan/tampilkan modul di sidebar
    this.availableModules.forEach(module => {
      const el = document.querySelector(`[data-module="${module}"]`);
      if (el) {
        if (this.activeModules.includes('all') || this.activeModules.includes(module)) {
          el.style.display = '';
          el.classList.remove('module-hidden');
        } else {
          el.style.display = 'none';
          el.classList.add('module-hidden');
        }
      }
    });

    // Kirim event ke komponen lain
    window.dispatchEvent(new CustomEvent('modulesUpdated', {
      detail: { activeModules: this.activeModules }
    }));
  }

  isActive(moduleName) {
    return this.activeModules.includes('all') || this.activeModules.includes(moduleName);
  }

  getActiveModules() {
    return this.activeModules;
  }

  // Manual override (buat admin)
  setActiveModules(modules) {
    this.activeModules = modules;
    this.apply();
  }

  reset() {
    this.init();
  }
}
