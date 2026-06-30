// web-pwa/js/operational/logistics/warung-darurat.js
// Sub-posko warga (warung darurat)

import { supabase } from '../../core/supabase.js';

export class WarungDarurat {
  constructor() {
    this.warungs = [];
    this.loadFromStorage();
  }

  loadFromStorage() {
    try {
      const saved = localStorage.getItem('warungDarurat');
      if (saved) {
        this.warungs = JSON.parse(saved);
      }
    } catch (e) {
      console.error('[WARUNG] Load error:', e);
    }
  }

  saveToStorage() {
    try {
      localStorage.setItem('warungDarurat', JSON.stringify(this.warungs));
    } catch (e) {
      console.error('[WARUNG] Save error:', e);
    }
  }

  registerWarung(warung) {
    warung.id = Date.now().toString(36);
    warung.waktu = new Date().toISOString();
    warung.status = 'active';
    this.warungs.push(warung);
    this.saveToStorage();
    this.syncToSupabase(warung);
    return warung;
  }

  getWarungs(limit = 20) {
    return this.warungs.slice(0, limit);
  }

  getNearbyWarungs(lat, lng, radius = 2) {
    // Simulasi filter berdasarkan lokasi
    return this.warungs.filter(w => w.status === 'active').slice(0, 5);
  }

  async syncToSupabase(warung) {
    try {
      await supabase.insert('warung_darurat', warung);
    } catch (e) {
      console.warn('[WARUNG] Sync error:', e);
    }
  }

  getStats() {
    return {
      total: this.warungs.length,
      active: this.warungs.filter(w => w.status === 'active').length,
      inactive: this.warungs.filter(w => w.status === 'inactive').length
    };
  }
}
