// ============================================
// APP.JS — SembakoKita.Pro v2026.07.01
// ============================================
// Main app controller — inisialisasi semua komponen
// ============================================

import { LocalBrain } from '../agent/local-brain.js';
import { ModeController } from '../adapters/mode-controller.js';
import { ModuleManager } from '../adapters/module-manager.js';
import { PowerSaver } from '../adapters/power-saver.js';
import { BackgroundSync } from '../synchronization/background-sync.js';
import { ConflictResolver } from '../synchronization/conflict-resolver.js';
import { Validator } from '../utils/validator.js';
import { supabase } from './supabase.js';
import { state } from './state-manager.js';
import { ui } from './components-ui.js';

class App {
  constructor() {
    this.version = '2026.07.01';
    this.initialized = false;
    this.components = {};
    this.supabase = supabase;
    this.state = state;
    this.ui = ui;
    this.init();
  }

  async init() {
    console.log(`🚀 SembakoKita.Pro v${this.version}`);

    try {
      // 1. Inisialisasi state
      await this.initState();

      // 2. Inisialisasi adapters
      await this.initAdapters();

      // 3. Inisialisasi sync
      await this.initSync();

      // 4. Inisialisasi utils
      await this.initUtils();

      // 5. Inisialisasi AI Agentic (Otak)
      await this.initBrain();

      // 6. Simpan ke window
      this.exposeToWindow();

      // 7. Binding UI
      this.bindUI();

      // 8. Cek kondisi awal
      await this.checkInitialStatus();

      // 9. Register service worker (kalo ada)
      this.registerSW();

      this.initialized = true;
      console.log('✅ SembakoKita.Pro siap!');
      this.ui.showToast('🚀 SembakoKita.Pro siap digunakan!', 'success');

    } catch (error) {
      console.error('[APP] Init error:', error);
      this.ui.showToast('⚠️ Error inisialisasi. Coba refresh.', 'error');
    }
  }

  // ============================================
  // 1. STATE
  // ============================================
  async initState() {
    this.components.state = this.state;
    
    // Load user dari localStorage
    const savedUser = localStorage.getItem('sembakoUser');
    if (savedUser) {
      try {
        this.state.set('user', JSON.parse(savedUser));
      } catch (e) {
        console.warn('[APP] Gagal load user:', e);
      }
    }

    console.log('[APP] State ready');
  }

  // ============================================
  // 2. ADAPTERS
  // ============================================
  async initAdapters() {
    this.components.modeController = new ModeController();
    this.components.moduleManager = new ModuleManager();
    this.components.powerSaver = new PowerSaver();

    // Simpan ke state
    this.state.set('mode', this.components.modeController.getMode());
    this.state.set('deviceInfo', this.components.modeController.device.info);

    console.log('[APP] Adapters ready');
  }

  // ============================================
  // 3. SYNC
  // ============================================
  async initSync() {
    this.components.sync = new BackgroundSync();
    this.components.conflictResolver = new ConflictResolver();

    // Simpan status sync ke state
    this.state.set('sync.status', 'idle');

    console.log('[APP] Sync ready');
  }

  // ============================================
  // 4. UTILS
  // ============================================
  async initUtils() {
    this.components.validator = new Validator();
    console.log('[APP] Utils ready');
  }

  // ============================================
  // 5. AI AGENTIC (OTAK)
  // ============================================
  async initBrain() {
    this.components.brain = new LocalBrain({
      mode: 'auto',
      securityLevel: 'maximum',
      voiceEnabled: true
    });

    // Simpan ke state
    this.state.set('brainReady', true);

    console.log('[APP] Brain ready');
  }

  // ============================================
  // 6. EXPOSE TO WINDOW
  // ============================================
  exposeToWindow() {
    window.Sembako = {
      app: this,
      brain: this.components.brain,
      supabase: this.supabase,
      state: this.state,
      ui: this.ui,
      version: this.version,
      mode: this.components.modeController,
      sync: this.components.sync
    };

    // Juga expose supabase langsung ke window
    window.supabaseClient = this.supabase;

    console.log('[APP] Exposed to window');
  }

  // ============================================
  // 7. BIND UI
  // ============================================
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
          // Optional: suara balasan
          if (this.components.brain.voice.isReady) {
            this.components.brain.voice.speak(response);
          }
        }
      });

      // Enter key
      if (chatInput) {
        chatInput.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            chatSend.click();
          }
        });
      }
    }

    // Voice button
    const voiceBtn = document.getElementById('voiceBtn');
    if (voiceBtn) {
      voiceBtn.addEventListener('click', async () => {
        if (!this.components.brain.voice.isReady) {
          this.ui.showToast('🎤 Voice tidak tersedia di HP ini', 'warning');
          return;
        }
        this.ui.showToast('🎤 Dengarkan...', 'info');
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
        const confirm = await this.showSOSConfirm();
        if (confirm) {
          const response = await this.components.brain.process('sos darurat', 'text');
          if (chatResponse) {
            chatResponse.innerText = response;
          }
          this.ui.showToast('🚨 SOS terkirim!', 'error');
          this.components.brain.voice.speak(response);
        }
      });
    }

    // Mode toggle
    const modeToggle = document.getElementById('modeToggle');
    if (modeToggle) {
      modeToggle.addEventListener('click', () => {
        const newMode = this.components.modeController.toggleMode();
        this.ui.showToast(`Mode: ${newMode.toUpperCase()}`, 'info');
      });
    }

    // Listen mode changes
    window.addEventListener('modeChanged', (event) => {
      this.onModeChange(event.detail);
    });

    // Listen health updates
    window.addEventListener('healthUpdate', (event) => {
      this.onHealthUpdate(event.detail);
    });

    // Listen sync updates
    window.addEventListener('syncModeChange', (event) => {
      this.state.set('sync.mode', event.detail.mode);
    });

    console.log('[APP] UI bound');
  }

  // ============================================
  // 8. CHECK INITIAL STATUS
  // ============================================
  async checkInitialStatus() {
    const status = this.components.modeController.getStatus();
    console.log('[APP] Status awal:', status);

    // Update state
    this.state.set('mode', status.mode);

    // Kalo mode survival, kasih tau user
    if (status.mode === 'survival') {
      this.ui.showToast('⚠️ Mode Survival aktif. Fitur dibatasi untuk hemat baterai.', 'warning');
    }

    // Cek koneksi
    if (!navigator.onLine) {
      this.ui.showToast('📡 Offline. Data akan disimpan lokal dan sync nanti.', 'info');
    }

    // Cek queue supabase
    const queueStatus = this.supabase.getQueueStatus();
    if (queueStatus.total > 0) {
      this.ui.showToast(`📦 Ada ${queueStatus.total} data menunggu sinkronisasi.`, 'info');
    }

    // Update UI mode indicator
    this.updateModeIndicator(status.mode);
  }

  // ============================================
  // 9. REGISTER SERVICE WORKER
  // ============================================
  registerSW() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('[APP] SW registered:', registration);
          this.state.set('swRegistered', true);

          // Listen SW messages
          navigator.serviceWorker.addEventListener('message', (event) => {
            if (event.data?.type === 'SYNC_COMPLETE') {
              console.log('[APP] Sync complete from SW');
              this.ui.showToast('✅ Sinkronisasi selesai!', 'success');
              this.state.set('sync.lastSync', event.data.timestamp);
            }
          });

        })
        .catch((error) => {
          console.warn('[APP] SW registration failed:', error);
          this.state.set('swRegistered', false);
        });
    }
  }

  // ============================================
  // EVENT HANDLERS
  // ============================================

  onModeChange(detail) {
    console.log('[APP] Mode changed:', detail.mode);
    this.state.set('mode', detail.mode);
    this.updateModeIndicator(detail.mode);
    this.ui.showToast(`Mode berubah ke: ${detail.mode.toUpperCase()}`, 'info');
  }

  onHealthUpdate(detail) {
    const { status } = detail;
    this.state.set('deviceInfo', status);
    
    // Kalo baterai rendah dan belum charging, kasih tau
    if (status.battery < 15 && !status.charging) {
      this.ui.showToast(`🔋 Baterai ${status.battery}%. Hubungkan charger.`, 'warning');
    }
  }

  // ============================================
  // UI HELPERS
  // ============================================

  updateModeIndicator(mode) {
    const indicator = document.getElementById('modeIndicator');
    if (indicator) {
      indicator.textContent = mode.toUpperCase();
      indicator.className = `mode-${mode}`;
    }
  }

  async showSOSConfirm() {
    return new Promise((resolve) => {
      this.ui.showModal({
        title: '🚨 KONFIRMASI SOS',
        content: `
          <p style="color:#f44336;font-weight:bold;font-size:18px;">
            Anda akan mengirim sinyal DARURAT!
          </p>
          <p style="color:#666;">
            Sinyal akan dikirim ke semua node dalam radius 2.4km.
            <br><strong>Gunakan hanya untuk keadaan darurat!</strong>
          </p>
        `,
        confirmText: '🚨 Kirim SOS',
        cancelText: 'Batal',
        onConfirm: () => resolve(true),
        onCancel: () => resolve(false)
      });
    });
  }

  // ============================================
  // PUBLIC API
  // ============================================

  getStatus() {
    return {
      version: this.version,
      initialized: this.initialized,
      mode: this.components.modeController.getMode(),
      device: this.components.modeController.device.info,
      isSecure: this.components.brain.isSecure(),
      queue: this.supabase.getQueueStatus(),
      sync: this.state.get('sync'),
      sw: this.state.get('swRegistered')
    };
  }

  async forceSync() {
    if (!navigator.onLine) {
      this.ui.showToast('📡 Offline. Tidak bisa sync.', 'warning');
      return { success: false, message: 'Offline' };
    }

    this.ui.showToast('🔄 Sinkronisasi...', 'info');
    const result = await this.supabase.forceSync();
    this.ui.showToast('✅ Sinkronisasi selesai!', 'success');
    return result;
  }

  async clearAllData() {
    return new Promise((resolve) => {
      this.ui.showModal({
        title: '⚠️ Hapus Semua Data',
        content: `
          <p style="color:#f44336;font-weight:bold;">
            Yakin ingin menghapus semua data?
          </p>
          <p style="color:#666;">
            Data yang dihapus: laporan, transaksi, stok, barter, dan pengaturan.
            <br><strong>Tindakan ini tidak bisa dibatalkan!</strong>
          </p>
        `,
        confirmText: '🗑️ Hapus Semua',
        cancelText: 'Batal',
        onConfirm: async () => {
          this.state.reset();
          localStorage.clear();
          await this.supabase.clearQueue();
          this.ui.showToast('🗑️ Semua data dihapus', 'warning');
          resolve(true);
        },
        onCancel: () => resolve(false)
      });
    });
  }

  destroy() {
    if (this.components.sync) {
      this.components.sync.stop();
    }
    if (this.components.powerSaver) {
      this.components.powerSaver.disable();
    }
    console.log('[APP] Destroyed');
  }
}

// ============================================
// AUTO-INIT
// ============================================
let appInstance = null;

document.addEventListener('DOMContentLoaded', () => {
  if (!appInstance) {
    appInstance = new App();
    window.app = appInstance;
  }
});

// Kalo DOM sudah ready, langsung init
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  if (!appInstance) {
    appInstance = new App();
    window.app = appInstance;
  }
}

// ============================================
// EXPORT
// ============================================
export default App;
export { appInstance as app };
