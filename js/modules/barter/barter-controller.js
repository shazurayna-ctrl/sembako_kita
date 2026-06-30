// web-pwa/js/modules/barter/barter-controller.js
// Manajemen barter + trust score

export class BarterController {
  constructor() {
    this.trustScore = 87;
    this.totalTransaksi = 142;
    this.rasio = {
      beras_telur: 1.82,
      minyak_gula: 1.42,
      gula_minyak: 1.08
    };
    this.riwayat = [];
    this.loadFromStorage();
  }

  loadFromStorage() {
    try {
      const saved = localStorage.getItem('barterData');
      if (saved) {
        const data = JSON.parse(saved);
        this.trustScore = data.trustScore || 87;
        this.totalTransaksi = data.totalTransaksi || 142;
        this.riwayat = data.riwayat || [];
      }
    } catch (e) {
      console.error('[BARTER] Load error:', e);
    }
  }

  saveToStorage() {
    try {
      localStorage.setItem('barterData', JSON.stringify({
        trustScore: this.trustScore,
        totalTransaksi: this.totalTransaksi,
        riwayat: this.riwayat
      }));
    } catch (e) {
      console.error('[BARTER] Save error:', e);
    }
  }

  getRasio(from, to) {
    const key = `${from}_${to}`;
    return this.rasio[key] || null;
  }

  calculate(fromQty, fromUnit, toUnit) {
    // Sederhana: berdasarkan rasio beras-telur
    const ratio = this.rasio.beras_telur;
    return {
      from: `${fromQty} ${fromUnit}`,
      to: `${(fromQty * ratio).toFixed(1)} ${toUnit}`,
      ratio: `1:${ratio.toFixed(2)}`
    };
  }

  addTransaksi(transaksi) {
    transaksi.id = Date.now().toString(36);
    transaksi.waktu = new Date().toISOString();
    transaksi.status = 'valid';
    this.riwayat.unshift(transaksi);
    this.totalTransaksi += 1;
    this.saveToStorage();
    return transaksi;
  }

  getRiwayat(limit = 10) {
    return this.riwayat.slice(0, limit);
  }

  getTrustScore() {
    return this.trustScore;
  }

  getStats() {
    return {
      trustScore: this.trustScore,
      totalTransaksi: this.totalTransaksi,
      successRate: 98.2,
      bleResponse: 91.5,
      ktpValidation: 76.3
    };
  }
}
