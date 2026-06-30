// web-pwa/js/operational/logistics/logistics-controller.js
// Manajemen logistik dan distribusi

import { supabase } from '../../core/supabase.js';

export class LogisticsController {
  constructor() {
    this.truks = [
      { id: 'B-1234-XY', supir: 'Pak Herman', muatan: 'Beras 200kg, Minyak 50L, Telur 30kg', status: 'berangkat' },
      { id: 'B-5678-AB', supir: 'Pak Agus', muatan: 'Gula 100kg, Garam 50kg', status: 'berangkat' },
      { id: 'B-9012-CD', supir: 'Pak Dedi', muatan: 'Kosong — menuju Pasar Baru', status: 'menuju' },
      { id: 'B-3456-EF', supir: 'Pak Rudi', muatan: 'Mie 200pcs, Sabun 50pcs', status: 'siap' }
    ];
    this.routes = [];
    this.loadFromStorage();
  }

  loadFromStorage() {
    try {
      const saved = localStorage.getItem('logisticsData');
      if (saved) {
        const data = JSON.parse(saved);
        this.truks = data.truks || this.truks;
        this.routes = data.routes || [];
      }
    } catch (e) {
      console.error('[LOGISTICS] Load error:', e);
    }
  }

  saveToStorage() {
    try {
      localStorage.setItem('logisticsData', JSON.stringify({
        truks: this.truks,
        routes: this.routes
      }));
    } catch (e) {
      console.error('[LOGISTICS] Save error:', e);
    }
  }

  getTruks() {
    return this.truks;
  }

  getRoutes() {
    return this.routes;
  }

  addRoute(route) {
    route.id = Date.now().toString(36);
    route.waktu = new Date().toISOString();
    route.status = 'planned';
    this.routes.push(route);
    this.saveToStorage();
    return route;
  }

  updateTrukStatus(id, status) {
    const truk = this.truks.find(t => t.id === id);
    if (truk) {
      truk.status = status;
      this.saveToStorage();
      return true;
    }
    return false;
  }

  getActiveDeliveries() {
    return this.truks.filter(t => t.status === 'berangkat' || t.status === 'menuju');
  }

  getStats() {
    return {
      totalTruks: this.truks.length,
      activeDeliveries: this.getActiveDeliveries().length,
      totalRoutes: this.routes.length,
      completedRoutes: this.routes.filter(r => r.status === 'completed').length
    };
  }
}
