// web-pwa/js/core/app.js
// Main app controller — inisialisasi semua komponen

import { LocalBrain } from '../agent/local-brain.js';
import { ModeController } from '../adapters/mode-controller.js';
import { ModuleManager } from '../adapters/module-manager.js';
import { PowerSaver } from '../adapters/power-saver.js';
import { BackgroundSync } from '../synchronization/background-sync.js';
import { ConflictResolver } from '../synchronization/conflict-resolver.js';
import { Validator } from '../utils/validator.js';

class App {
  constructor() {
    this.version = '2026.07.01';
    this.initialized = false;
    this.components = {};
    this.init();
  }

  async init() {
    console.log(`🚀 SembakoKita.Pro v${this.version}`);

    // 1. Inisialisasi adapters
    this.components.modeController = new ModeController();
    this.components.moduleManager = new ModuleManager();
    this.components.powerSaver = new PowerSaver();

    // 2. Inisialisasi sync
    this.components.sync = new BackgroundSync();
    this.components.conflictResolver = new ConflictResolver();

    // 3. Inisialisasi utils
    this.components.validator = new Validator();

    // 4. Inisialisasi AI Agentic (Otak)
    this.components.brain = new LocalBrain({
      mode: 'auto',
      securityLevel: 'maximum',
      voiceEnabled: true
    });

    // 5. Simpan ke window
    window.Sembako = {
      app: this,
      brain: this.components.brain,
      version: this.version
    };

    // 6. Binding UI
    this.bindUI();

    // 7. Cek kondisi awal
    await this.checkInitialStatus();

    this.initialized = true;
    console.log('✅ SembakoKita.Pro siap!');
  }

  bindUI() {
    // Chat input
    const chatInput = document.getElementById('chatInput');
    const chatSend = document.getElementById('chatSend');
    const chatResponse = document.getElementById('chatResponse');

    if (chatSend) {
      chatSend.addEventListener('click', async () => {
        const text = chatInput?.value || '';
        if (text.trim()) {
          const response = await this.components.brain.process(text, 'text');
          if (chatResponse) {
            chatResponse.innerText = response;
          }
          if (chatInput) chatInput.value = '';
        }
      });
    }

    // Voice button
    const voiceBtn = document.getElementById('voiceBtn');
    if (voiceBtn) {
      voiceBtn.addEventListener('click', async () => {
        const response = await this.components.brain.process(null, 'voice');
        if (chatResponse) {
          chatResponse.innerText = response;
        }
        this.components.brain.voice.speak(response);
      });
    }

    // SOS button
    const sosBtn = document.getElementById('sosBtn');
    if (sosBtn) {
      sosBtn.addEventListener('click', async () => {
        const response = await this.components.brain.process('sos darurat', 'text');
        if (chatResponse) {
          chatResponse.innerText = response;
        }
      });
    }

    // Mode toggle
    const modeToggle = document.getElementById('modeToggle');
    if (modeToggle) {
      modeToggle.addEventListener('click', () => {
        const newMode = this.components.modeController.toggleMode();
        this.showToast(`Mode: ${newMode.toUpperCase()}`);
      });
    }

    // Listen mode changes
    window.addEventListener('modeChanged', (event) => {
      this.onModeChange(event.detail);
    });
  }

  onModeChange(detail) {
    console.log('[APP] Mode changed:', detail.mode);
    const modeIndicator = document.getElementById('modeIndicator');
    if (modeIndicator) {
      modeIndicator.textContent = detail.mode.toUpperCase();
      modeIndicator.className = `mode-${detail.mode}`;
    }
    this.showToast(`Mode berubah ke: ${detail.mode.toUpperCase()}`);
  }

  async checkInitialStatus() {
    const status = this.components.modeController.getStatus();
    console.log('[APP] Status awal:', status);

    // Kalo mode survival, kasih tau user
    if (status.mode === 'survival') {
      this.showToast('⚠️ Mode Survival aktif. Fitur dibatasi untuk hemat baterai.');
    }

    // Cek koneksi
    if (!navigator.onLine) {
      this.showToast('📡 Offline. Data akan disimpan lokal dan sync nanti.');
    }
  }

  showToast(message, duration = 3000) {
    const existing = document.querySelector('.toast-notification');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0,0,0,0.85);
      color: white;
      padding: 12px 24px;
      border-radius: 12px;
      font-size: 14px;
      z-index: 99999;
      max-width: 90%;
      text-align: center;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      animation: fadeInUp 0.3s ease;
    `;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }

  getStatus() {
    return {
      version: this.version,
      initialized: this.initialized,
      mode: this.components.modeController.getMode(),
      device: this.components.modeController.device.info,
      isSecure: this.components.brain.isSecure()
    };
  }
}

// 🔥 Auto-init saat DOM ready
document.addEventListener('DOMContentLoaded', () => {
  window.app = new App();
});

// Tambahkan CSS untuk toast
const style = document.createElement('style');
style.textContent = `
  @keyframes fadeInUp {
    from { opacity: 0; transform: translateX(-50%) translateY(20px); }
    to { opacity: 1; transform: translateX(-50%) translateY(0); }
  }
  .mode-normal { color: #4CAF50; }
  .mode-krisis { color: #FF9800; }
  .mode-survival { color: #f44336; }
`;
document.head.appendChild(style);
