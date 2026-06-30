// web-pwa/js/agent/self-optimizer.js
// Optimasi performa: matiin fitur berat, atur UI, hemat baterai

export class SelfOptimizer {
  constructor() {
    this.optimizations = {
      normal: {
        animasi: true,
        sync: 'real-time',
        fitur: ['all'],
        ui: 'full-color'
      },
      krisis: {
        animasi: false,
        sync: 'every-1-hour',
        fitur: ['dashboard', 'kasir', 'stok', 'mesh'],
        ui: 'minimal'
      },
      survival: {
        animasi: false,
        sync: 'off',
        fitur: ['laporan', 'sos'],
        ui: 'hitam-putih'
      }
    };
  }

  // 🚀 Optimasi berdasarkan mode
  optimize(mode) {
    const config = this.optimizations[mode] || this.optimizations.normal;
    
    // 1. Atur animasi
    this.setAnimation(config.animasi);

    // 2. Atur UI
    this.setUI(config.ui);

    // 3. Atur sync
    this.setSync(config.sync);

    // 4. Atur fitur
    this.setFeatures(config.fitur);

    // 5. Hemat baterai
    if (mode === 'survival') {
      this.enablePowerSaver();
    } else {
      this.disablePowerSaver();
    }

    console.log('[OPTIMIZER] Optimized for mode:', mode, config);
    return config;
  }

  // 🎨 Atur animasi
  setAnimation(enabled) {
    const style = document.createElement('style');
    if (enabled) {
      style.textContent = `
        * { transition: all 0.3s ease; }
        .slide { animation: slideIn 0.3s ease; }
        @keyframes slideIn { from { transform: translateX(20px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
      `;
    } else {
      style.textContent = `
        * { transition: none !important; animation: none !important; }
        .slide { animation: none !important; }
      `;
    }
    // Hapus style lama
    const oldStyle = document.getElementById('optimizer-style');
    if (oldStyle) oldStyle.remove();
    style.id = 'optimizer-style';
    document.head.appendChild(style);
  }

  // 🎨 Atur UI mode
  setUI(mode) {
    // Hapus semua class mode
    document.body.classList.remove('mode-normal', 'mode-krisis', 'mode-survival');
    document.body.classList.add(`mode-${mode}`);

    // Load CSS sesuai mode
    const link = document.createElement('link');
    link.id = 'mode-css';
    link.rel = 'stylesheet';
    link.href = `/css/style-${mode}.css`;
    
    // Hapus CSS mode lama
    const oldLink = document.getElementById('mode-css');
    if (oldLink) oldLink.remove();
    document.head.appendChild(link);
  }

  // 🔄 Atur sync
  setSync(mode) {
    // Simpan ke localStorage biar background-sync baca
    localStorage.setItem('syncMode', mode);
    
    // Kirim event ke sync engine
    window.dispatchEvent(new CustomEvent('syncModeChange', {
      detail: { mode }
    }));
  }

  // 🧩 Atur fitur yang aktif
  setFeatures(features) {
    // Sembunyikan/tampilkan fitur di sidebar
    const allModules = ['inventory', 'barter', 'mesh', 'ai', 'ledger', 'defense'];
    
    if (features.includes('all')) {
      // Tampilkan semua
      allModules.forEach(module => {
        const el = document.querySelector(`[data-module="${module}"]`);
        if (el) el.style.display = '';
      });
    } else {
      // Hanya tampilkan yang diizinkan
      allModules.forEach(module => {
        const el = document.querySelector(`[data-module="${module}"]`);
        if (el) {
          el.style.display = features.includes(module) ? '' : 'none';
        }
      });
    }
  }

  // 🔋 Hemat daya (mode survival)
  enablePowerSaver() {
    // Kurangi refresh rate, matikan GPS, dll
    // Simpan flag ke localStorage
    localStorage.setItem('powerSaver', 'true');

    // Matikan requestAnimationFrame berlebihan
    const originalRAF = window.requestAnimationFrame;
    window.requestAnimationFrame = function(callback) {
      // Panggil lebih jarang di mode survival
      return setTimeout(callback, 100);
    };

    // Kurangi interval background
    const originalSetInterval = window.setInterval;
    window.setInterval = function(callback, interval) {
      if (interval < 10000) {
        // Perpanjang interval untuk hemat baterai
        return originalSetInterval(callback, Math.max(interval * 2, 10000));
      }
      return originalSetInterval(callback, interval);
    };
  }

  // 🔋 Matikan mode hemat daya
  disablePowerSaver() {
    localStorage.removeItem('powerSaver');
    
    // Kembalikan requestAnimationFrame
    delete window.requestAnimationFrame;
    // Kembalikan setInterval
    delete window.setInterval;
  }
}
