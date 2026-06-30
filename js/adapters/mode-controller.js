// web-pwa/js/adapters/mode-controller.js
// Kontrol mode Normal/Krisis/Survival

import { DeviceHealth } from './device-health.js';
import { ModuleManager } from './module-manager.js';
import { PowerSaver } from './power-saver.js';

export class ModeController {
  constructor() {
    this.device = new DeviceHealth();
    this.moduleManager = new ModuleManager();
    this.powerSaver = new PowerSaver();
    this.currentMode = 'normal';
    this.modes = ['normal', 'krisis', 'survival'];
    this.init();
  }

  async init() {
    await this.device.detect();
    this.currentMode = this.device.getMode();
    this.applyMode(this.currentMode);
    console.log('[MODE] Mode:', this.currentMode);
  }

  applyMode(mode) {
    if (!this.modes.includes(mode)) return;

    this.currentMode = mode;
    const rec = this.device.getRecommendation();

    // 1. Update UI
    document.body.classList.remove('mode-normal', 'mode-krisis', 'mode-survival');
    document.body.classList.add(`mode-${mode}`);

    // 2. Update CSS
    const link = document.createElement('link');
    link.id = 'mode-css';
    link.rel = 'stylesheet';
    link.href = `/css/style-${mode}.css`;
    document.getElementById('mode-css')?.remove();
    document.head.appendChild(link);

    // 3. Update modul
    this.moduleManager.setActiveModules(rec.fitur);

    // 4. Update animasi
    if (rec.animasi) {
      document.body.classList.remove('no-animation');
    } else {
      document.body.classList.add('no-animation');
    }

    // 5. Power saver (otomatis)
    if (mode === 'survival') {
      this.powerSaver.enable();
    } else {
      this.powerSaver.disable();
    }

    // 6. Kirim event
    window.dispatchEvent(new CustomEvent('modeChanged', {
      detail: { mode, recommendation: rec }
    }));

    // 7. Simpan ke localStorage
    localStorage.setItem('sembako-mode', mode);
  }

  setMode(mode) {
    if (this.modes.includes(mode)) {
      this.applyMode(mode);
      return true;
    }
    return false;
  }

  getMode() {
    return this.currentMode;
  }

  toggleMode() {
    const currentIndex = this.modes.indexOf(this.currentMode);
    const nextIndex = (currentIndex + 1) % this.modes.length;
    this.setMode(this.modes[nextIndex]);
    return this.currentMode;
  }

  getStatus() {
    return {
      mode: this.currentMode,
      recommendation: this.device.getRecommendation(),
      deviceInfo: this.device.info
    };
  }
}
