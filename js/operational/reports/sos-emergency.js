// web-pwa/js/operational/reports/sos-emergency.js
// Tombol SOS darurat

import { supabase } from '../../core/supabase.js';
import { ui } from '../../core/components-ui.js';

export class SOSEmergency {
  constructor() {
    this.activeSOS = [];
    this.loadFromStorage();
  }

  loadFromStorage() {
    try {
      const saved = localStorage.getItem('activeSOS');
      if (saved) {
        this.activeSOS = JSON.parse(saved);
      }
    } catch (e) {
      console.error('[SOS] Load error:', e);
    }
  }

  saveToStorage() {
    try {
      localStorage.setItem('activeSOS', JSON.stringify(this.activeSOS));
    } catch (e) {
      console.error('[SOS] Save error:', e);
    }
  }

  triggerSOS(data) {
    const sos = {
      id: Date.now().toString(36),
      lat: data.lat || null,
      lng: data.lng || null,
      message: data.message || 'SOS Darurat!',
      waktu: new Date().toISOString(),
      status: 'active',
      radius: data.radius || 2.4,
      nodes: data.nodes || 4
    };

    this.activeSOS.unshift(sos);
    this.saveToStorage();
    this.broadcastSOS(sos);
    return sos;
  }

  async broadcastSOS(sos) {
    // Kirim ke Supabase
    try {
      await supabase.insert('sos_emergency', sos);
    } catch (e) {
      console.warn('[SOS] Broadcast error:', e);
    }

    // Notifikasi via UI
    ui.showToast('🚨 SOS terkirim ke semua node!', 'error');

    // Kirim ke service worker untuk notifikasi
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      registration.showNotification('🚨 SOS Darurat!', {
        body: sos.message,
        icon: '/assets/icons/icon-192.png',
        vibrate: [200, 100, 200, 100, 500],
        requireInteraction: true
      });
    }

    console.log('[SOS] Broadcasted:', sos);
  }

  resolveSOS(id) {
    const sos = this.activeSOS.find(s => s.id === id);
    if (sos) {
      sos.status = 'resolved';
      sos.resolvedAt = new Date().toISOString();
      this.saveToStorage();
      return true;
    }
    return false;
  }

  getActiveSOS() {
    return this.activeSOS.filter(s => s.status === 'active');
  }

  getHistory(limit = 10) {
    return this.activeSOS.slice(0, limit);
  }

  getStats() {
    return {
      active: this.getActiveSOS().length,
      total: this.activeSOS.length,
      resolved: this.activeSOS.filter(s => s.status === 'resolved').length
    };
  }
}
