// web-pwa/js/modules/defense/security-controller.js
// Keamanan & Relawan

export class SecurityController {
  constructor() {
    this.relawan = [
      { nama: 'Budi', keahlian: 'Logistik', status: 'siap', rating: 4.5 },
      { nama: 'Andi', keahlian: 'Teknik', status: 'siap', rating: 4.8 },
      { nama: 'Dewi', keahlian: 'Medis', status: 'siap', rating: 4.2 }
    ];
    this.laporanKeamanan = [];
    this.threatLevel = 'Normal';
    this.loadFromStorage();
  }

  loadFromStorage() {
    try {
      const saved = localStorage.getItem('securityData');
      if (saved) {
        const data = JSON.parse(saved);
        this.relawan = data.relawan || this.relawan;
        this.laporanKeamanan = data.laporanKeamanan || [];
        this.threatLevel = data.threatLevel || 'Normal';
      }
    } catch (e) {
      console.error('[SECURITY] Load error:', e);
    }
  }

  saveToStorage() {
    try {
      localStorage.setItem('securityData', JSON.stringify({
        relawan: this.relawan,
        laporanKeamanan: this.laporanKeamanan,
        threatLevel: this.threatLevel
      }));
    } catch (e) {
      console.error('[SECURITY] Save error:', e);
    }
  }

  getRelawan() {
    return this.relawan;
  }

  addRelawan(relawan) {
    relawan.id = Date.now();
    this.relawan.push(relawan);
    this.saveToStorage();
    return relawan;
  }

  getRelawanTerdekat(radius) {
    // Simulasi: semua relawan dianggap terdekat
    return this.relawan.filter(r => r.status === 'siap');
  }

  addLaporan(laporan) {
    laporan.id = Date.now().toString(36);
    laporan.waktu = new Date().toISOString();
    this.laporanKeamanan.unshift(laporan);
    this.saveToStorage();
    return laporan;
  }

  getLaporan(limit = 10) {
    return this.laporanKeamanan.slice(0, limit);
  }

  setThreatLevel(level) {
    this.threatLevel = level;
    this.saveToStorage();
  }

  getThreatLevel() {
    return this.threatLevel;
  }

  getStats() {
    return {
      totalRelawan: this.relawan.length,
      relawanSiap: this.relawan.filter(r => r.status === 'siap').length,
      threatLevel: this.threatLevel,
      totalLaporan: this.laporanKeamanan.length
    };
  }
}
