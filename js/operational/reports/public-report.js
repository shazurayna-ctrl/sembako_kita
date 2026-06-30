// web-pwa/js/operational/reports/public-report.js
// Laporan publik — bisa dilihat semua warga

import { ReportController } from './report-controller.js';

export class PublicReport extends ReportController {
  constructor() {
    super();
    this.publicVisible = true;
  }

  getPublicReports() {
    // Filter laporan yang statusnya 'public' atau 'resolved'
    return this.reports.filter(r => r.status === 'resolved' || r.publicVisible);
  }

  getNearbyReports(lat, lng, radius = 1) {
    // Simulasi filter berdasarkan lokasi
    return this.getPublicReports().slice(0, 5);
  }

  makePublic(id) {
    const report = this.reports.find(r => r.id === id);
    if (report) {
      report.publicVisible = true;
      this.saveToStorage();
      return true;
    }
    return false;
  }

  getStats() {
    const base = super.getStats();
    return {
      ...base,
      public: this.getPublicReports().length
    };
  }
}
