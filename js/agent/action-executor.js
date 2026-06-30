// web-pwa/js/agent/action-executor.js
export class ActionExecutor {
  constructor() {
    this.actions = {
      report: this.handleReport.bind(this),
      stok: this.handleStok.bind(this),
      bantuan: this.handleBantuan.bind(this),
      sos: this.handleSOS.bind(this),
      checklist: this.handleChecklist.bind(this),
      barter: this.handleBarter.bind(this)
    };
  }

  async handleReport(text, context) {
    const report = {
      id: Date.now().toString(36),
      text,
      waktu: new Date().toISOString(),
      mode: context.mode,
      status: 'pending'
    };

    try {
      await this.saveReport(report);
      return `✅ Laporan sudah saya catat. Terima kasih, Bu/Pak. 🙏`;
    } catch (error) {
      console.error('[EXECUTOR] Gagal simpan laporan:', error);
      return 'Maaf, gagal menyimpan laporan. Coba lagi.';
    }
  }

  async handleStok(text, context) {
    const stokData = {
      beras: { stok: 446, satuan: 'kg', minimal: 100 },
      minyak: { stok: 277, satuan: 'liter', minimal: 80 },
      telur: { stok: 117, satuan: 'kg', minimal: 50 },
      gula: { stok: 198, satuan: 'kg', minimal: 60 }
    };

    let response = '📦 **Stok Gudang:**\n';
    let menipis = false;
    for (const [item, data] of Object.entries(stokData)) {
      const status = data.stok <= data.minimal ? '⚠️ Menipis' : '✅ Aman';
      if (data.stok <= data.minimal) menipis = true;
      response += `- ${item}: ${data.stok} ${data.satuan} (${status})\n`;
    }
    if (menipis) response += '\n⚠️ Ada stok menipis! Segera pengadaan.';
    return response;
  }

  async handleBantuan(text, context) {
    return `🆘 Dalam radius 500m: 3 warga siap bantu.\n- Pak Budi (200m) ✅\n- Bu Siti (350m) ✅\n- Pak Joko (480m) ❌`;
  }

  async handleSOS(context) {
    await this.broadcastSOS({ waktu: new Date().toISOString() });
    return `🚨 SOS terkirim ke semua node! Bantuan dalam perjalanan. Tetap tenang.`;
  }

  async handleChecklist(text, context) {
    return `📋 Hari ini:\n- Stok Pasar Cibitung\n- Verifikasi 15 KK\n- Backup DB\n- Laporan BPBD\n- Kalibrasi timbangan`;
  }

  async handleBarter(text, context) {
    return `🔄 Rasio: 1kg Beras = 1.82kg Telur\n⭐ Trust Score: 87 (Tinggi)`;
  }

  async saveReport(report) {
    const db = await this.openDB();
    const tx = db.transaction('reports', 'readwrite');
    const store = tx.objectStore('reports');
    await store.add(report);
  }

  async broadcastSOS(data) {
    console.log('[EXECUTOR] SOS Broadcast:', data);
    return true;
  }

  openDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('SembakoDB', 1);
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('reports')) {
          db.createObjectStore('reports', { keyPath: 'id' });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
}
