// web-pwa/js/operational/checklist/checklist-controller.js
// Manajemen checklist harian posko

import { state } from '../../core/state-manager.js';
import { supabase } from '../../core/supabase.js';
import { ui } from '../../core/components-ui.js';

export class ChecklistController {
  constructor() {
    this.data = {
      laporanMasuk: [],
      targetBesok: [],
      eksekusiHariIni: []
    };
    this.loadFromStorage();
  }

  loadFromStorage() {
    try {
      const saved = localStorage.getItem('checklistData');
      if (saved) {
        this.data = JSON.parse(saved);
      } else {
        // Data default
        this.data = {
          laporanMasuk: [
            { id: 1, text: 'Kelangkaan beras di RW 07', prioritas: 'darurat', waktu: '2 jam lalu', status: 'pending' },
            { id: 2, text: 'Ibu Sari butuh minyak goreng', prioritas: 'normal', waktu: '5 jam lalu', status: 'pending' },
            { id: 3, text: 'Kebocoran air bersih RT 03', prioritas: 'darurat', waktu: '6 jam lalu', status: 'pending' },
            { id: 4, text: 'Permintaan gula 10kg PKK', prioritas: 'normal', waktu: '8 jam lalu', status: 'pending' }
          ],
          targetBesok: [
            { id: 1, text: 'Distribusi 50kg beras ke RW 07', relawan: 'Budi', status: 'pending' },
            { id: 2, text: 'Perbaikan pipa air RT 03', relawan: 'Andi', status: 'pending' },
            { id: 3, text: 'Antar 5L minyak ke Ibu Sari', relawan: 'Dewi', status: 'pending' }
          ],
          eksekusiHariIni: [
            { id: 1, text: 'Pengambilan stok di Pasar Cibitung', detail: 'Truk B-1234-XY', status: 'progress' },
            { id: 2, text: 'Verifikasi data 15 KK baru', detail: 'Admin: Rina', status: 'progress' },
            { id: 3, text: 'Backup database ke USB', detail: 'Selesai 10:00', status: 'done' },
            { id: 4, text: 'Laporan harian ke BPBD', detail: 'Selesai 11:30', status: 'done' },
            { id: 5, text: 'Kalibrasi timbangan posko', detail: 'Selesai 13:00', status: 'done' }
          ]
        };
        this.saveToStorage();
      }
    } catch (e) {
      console.error('[CHECKLIST] Load error:', e);
    }
  }

  saveToStorage() {
    try {
      localStorage.setItem('checklistData', JSON.stringify(this.data));
    } catch (e) {
      console.error('[CHECKLIST] Save error:', e);
    }
  }

  // Laporan Masuk
  getLaporanMasuk() {
    return this.data.laporanMasuk;
  }

  addLaporanMasuk(laporan) {
    laporan.id = Date.now();
    laporan.status = 'pending';
    laporan.waktu = new Date().toISOString();
    this.data.laporanMasuk.unshift(laporan);
    this.saveToStorage();
    this.syncToSupabase('laporan_masuk', laporan);
    return laporan;
  }

  updateLaporanMasuk(id, updates) {
    const index = this.data.laporanMasuk.findIndex(l => l.id === id);
    if (index !== -1) {
      this.data.laporanMasuk[index] = { ...this.data.laporanMasuk[index], ...updates };
      this.saveToStorage();
      return true;
    }
    return false;
  }

  // Target Besok
  getTargetBesok() {
    return this.data.targetBesok;
  }

  addTargetBesok(target) {
    target.id = Date.now();
    target.status = 'pending';
    this.data.targetBesok.push(target);
    this.saveToStorage();
    return target;
  }

  updateTargetBesok(id, updates) {
    const index = this.data.targetBesok.findIndex(t => t.id === id);
    if (index !== -1) {
      this.data.targetBesok[index] = { ...this.data.targetBesok[index], ...updates };
      this.saveToStorage();
      return true;
    }
    return false;
  }

  // Eksekusi Hari Ini
  getEksekusiHariIni() {
    return this.data.eksekusiHariIni;
  }

  addEksekusi(eksekusi) {
    eksekusi.id = Date.now();
    eksekusi.status = 'progress';
    this.data.eksekusiHariIni.push(eksekusi);
    this.saveToStorage();
    return eksekusi;
  }

  updateEksekusi(id, updates) {
    const index = this.data.eksekusiHariIni.findIndex(e => e.id === id);
    if (index !== -1) {
      this.data.eksekusiHariIni[index] = { ...this.data.eksekusiHariIni[index], ...updates };
      this.saveToStorage();
      return true;
    }
    return false;
  }

  // Sync ke Supabase
  async syncToSupabase(table, data) {
    try {
      await supabase.insert(table, data);
    } catch (e) {
      console.warn('[CHECKLIST] Sync error:', e);
    }
  }

  // Reset harian
  resetDaily() {
    this.data.eksekusiHariIni = [];
    this.data.targetBesok = [];
    this.saveToStorage();
  }

  getStats() {
    return {
      totalLaporan: this.data.laporanMasuk.length,
      laporanDarurat: this.data.laporanMasuk.filter(l => l.prioritas === 'darurat').length,
      targetPending: this.data.targetBesok.filter(t => t.status === 'pending').length,
      eksekusiProgress: this.data.eksekusiHariIni.filter(e => e.status === 'progress').length
    };
  }
}
