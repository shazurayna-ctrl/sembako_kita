// web-pwa/js/operational/reports/report-controller.js
// Manajemen laporan warga

import { supabase } from '../../core/supabase.js';
import { state } from '../../core/state-manager.js';

export class ReportController {
  constructor() {
    this.reports = [];
    this.loadFromStorage();
  }

  loadFromStorage() {
    try {
      const saved = localStorage.getItem('reports');
      if (saved) {
        this.reports = JSON.parse(saved);
      }
    } catch (e) {
      console.error('[REPORT] Load error:', e);
    }
  }

  saveToStorage() {
    try {
      localStorage.setItem('reports', JSON.stringify(this.reports));
    } catch (e) {
      console.error('[REPORT] Save error:', e);
    }
  }

  addReport(report) {
    report.id = Date.now().toString(36);
    report.waktu = new Date().toISOString();
    report.status = 'pending';
    report.prioritas = this.detectPriority(report.text);
    this.reports.unshift(report);
    this.saveToStorage();
    this.syncToSupabase(report);
    return report;
  }

  detectPriority(text) {
    const keywords = ['darurat', 'sos', 'tolong', 'krisis', 'bahaya', 'kebakaran', 'banjir'];
    const lower = text.toLowerCase();
    for (const word of keywords) {
      if (lower.includes(word)) return 'darurat';
    }
    return 'normal';
  }

  getAllReports() {
    return this.reports;
  }

  getPendingReports() {
    return this.reports.filter(r => r.status === 'pending');
  }

  getDaruratReports() {
    return this.reports.filter(r => r.prioritas === 'darurat');
  }

  updateStatus(id, status) {
    const report = this.reports.find(r => r.id === id);
    if (report) {
      report.status = status;
      this.saveToStorage();
      return true;
    }
    return false;
  }

  async syncToSupabase(report) {
    try {
      await supabase.insert('reports', report);
    } catch (e) {
      console.warn('[REPORT] Sync error:', e);
    }
  }

  getStats() {
    return {
      total: this.reports.length,
      pending: this.getPendingReports().length,
      darurat: this.getDaruratReports().length,
      resolved: this.reports.filter(r => r.status === 'resolved').length
    };
  }
}
