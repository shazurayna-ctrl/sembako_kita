// web-pwa/js/adapters/power-saver.js
// Mode hemat daya ekstrem untuk HP dengan baterai rendah

export class PowerSaver {
  constructor() {
    this.isActive = false;
    this.originalIntervals = [];
    this.originalRAF = null;
    this.checkBattery();
  }

  async checkBattery() {
    if (navigator.getBattery) {
      const battery = await navigator.getBattery();
      const level = Math.round(battery.level * 100);
      
      if (level < 15 && !battery.charging) {
        this.enable();
      } else if (level > 30 || battery.charging) {
        this.disable();
      }

      // Pantau perubahan baterai
      battery.addEventListener('levelchange', () => {
        const newLevel = Math.round(battery.level * 100);
        if (newLevel < 15 && !battery.charging) {
          this.enable();
        } else if (newLevel > 30 || battery.charging) {
          this.disable();
        }
      });
    }
  }

  enable() {
    if (this.isActive) return;
    this.isActive = true;

    // 1. Kurangi refresh rate
    this.originalRAF = window.requestAnimationFrame;
    window.requestAnimationFrame = function(callback) {
      return setTimeout(callback, 100); // 10 fps
    };

    // 2. Perpanjang interval
    const originalSetInterval = window.setInterval;
    window.setInterval = function(callback, interval) {
      if (interval < 10000) {
        return originalSetInterval(callback, Math.max(interval * 2, 10000));
      }
      return originalSetInterval(callback, interval);
    };

    // 3. Matikan animasi
    document.body.classList.add('power-saver');
    const style = document.createElement('style');
    style.id = 'power-saver-style';
    style.textContent = `
      * { transition: none !important; animation: none !important; }
      .power-saver { filter: grayscale(0.8); }
      .power-saver img, .power-saver video { display: none; }
    `;
    document.head.appendChild(style);

    // 4. Notifikasi ke user
    this.showNotification();

    console.log('[POWER] Mode hemat daya aktif');
  }

  disable() {
    if (!this.isActive) return;
    this.isActive = false;

    // Kembalikan RAF
    if (this.originalRAF) {
      window.requestAnimationFrame = this.originalRAF;
    }

    // Kembalikan setInterval
    delete window.setInterval;

    // Matikan style
    document.body.classList.remove('power-saver');
    document.getElementById('power-saver-style')?.remove();

    console.log('[POWER] Mode hemat daya nonaktif');
  }

  showNotification() {
    const notification = document.createElement('div');
    notification.id = 'power-saver-notification';
    notification.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 20px;
      right: 20px;
      background: #ff4444;
      color: white;
      padding: 16px;
      border-radius: 12px;
      text-align: center;
      font-weight: bold;
      z-index: 9999;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    `;
    notification.innerHTML = `
      🔋 <strong>Mode Hemat Daya Aktif</strong><br>
      Baterai rendah. Fitur berat dimatikan.
      <button onclick="this.parentElement.remove()" style="
        background: white;
        color: #ff4444;
        border: none;
        padding: 8px 16px;
        border-radius: 8px;
        margin-top: 8px;
        font-weight: bold;
        cursor: pointer;
      ">Tutup</button>
    `;
    document.body.appendChild(notification);

    // Hapus otomatis setelah 10 detik
    setTimeout(() => {
      notification.remove();
    }, 10000);
  }

  isActiveMode() {
    return this.isActive;
  }
}
