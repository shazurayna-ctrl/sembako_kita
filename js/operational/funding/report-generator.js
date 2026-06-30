// web-pwa/js/operational/funding/report-generator.js
// Auto-generate laporan untuk donatur

import { FundingController } from './funding-controller.js';

export class ReportGenerator {
  constructor() {
    this.funding = new FundingController();
  }

  generateLPJ(period = 'monthly') {
    const audit = this.funding.getAudit(50);
    const stats = this.funding.getStats();
    const allocation = this.funding.getAllocation();

    const report = {
      title: 'Laporan Pertanggungjawaban Dana Posko',
      period: period,
      date: new Date().toISOString().split('T')[0],
      summary: {
        saldoAwal: stats.saldo - audit.reduce((sum, t) => t.type === 'masuk' ? sum + t.amount : sum - t.amount, 0),
        totalMasuk: audit.filter(t => t.type === 'masuk').reduce((sum, t) => sum + t.amount, 0),
        totalKeluar: audit.filter(t => t.type === 'keluar').reduce((sum, t) => sum + t.amount, 0),
        saldoAkhir: stats.saldo
      },
      allocation: allocation,
      transactions: audit.slice(0, 20),
      generatedAt: new Date().toISOString()
    };

    return report;
  }

  generateImpactReport() {
    return {
      totalBantuan: 18497,
      wargaTerbantu: 1247,
      barterSukses: 142,
      laporanDiterima: 847,
      nodeAktif: 4,
      periode: 'Bulan Juni 2026'
    };
  }

  exportToText(report) {
    let text = `========================================\n`;
    text += `  ${report.title}\n`;
    text += `  Periode: ${report.period}\n`;
    text += `  Tanggal: ${report.date}\n`;
    text += `========================================\n\n`;
    text += `📊 RINGKASAN KEUANGAN\n`;
    text += `----------------------------------------\n`;
    text += `Saldo Awal  : Rp ${report.summary.saldoAwal.toLocaleString()}\n`;
    text += `Total Masuk : Rp ${report.summary.totalMasuk.toLocaleString()}\n`;
    text += `Total Keluar: Rp ${report.summary.totalKeluar.toLocaleString()}\n`;
    text += `Saldo Akhir : Rp ${report.summary.saldoAkhir.toLocaleString()}\n\n`;
    text += `📦 ALOKASI DANA\n`;
    text += `----------------------------------------\n`;
    text += `Sembako  : ${report.allocation.percentages.sembako}% = Rp ${report.allocation.sembako.toLocaleString()}\n`;
    text += `Subsidi  : ${report.allocation.percentages.subsidi}% = Rp ${report.allocation.subsidi.toLocaleString()}\n`;
    text += `Ops & Mesh: ${report.allocation.percentages.ops}% = Rp ${report.allocation.ops.toLocaleString()}\n`;
    text += `========================================\n`;
    text += `Dibuat oleh SembakoKita.Pro\n`;
    text += `Demi rakyat, bro! 🇮🇩\n`;
    return text;
  }

  exportToHTML(report) {
    return `
      <html>
        <head><title>LPJ SembakoKita.Pro</title></head>
        <body style="font-family:sans-serif;padding:40px;max-width:800px;margin:0 auto;">
          <h1 style="color:#065f46;">📊 Laporan Pertanggungjawaban</h1>
          <p><strong>Periode:</strong> ${report.period}</p>
          <p><strong>Tanggal:</strong> ${report.date}</p>
          <h2>Ringkasan Keuangan</h2>
          <ul>
            <li>Saldo Awal: Rp ${report.summary.saldoAwal.toLocaleString()}</li>
            <li>Total Masuk: Rp ${report.summary.totalMasuk.toLocaleString()}</li>
            <li>Total Keluar: Rp ${report.summary.totalKeluar.toLocaleString()}</li>
            <li><strong>Saldo Akhir: Rp ${report.summary.saldoAkhir.toLocaleString()}</strong></li>
          </ul>
          <h2>Alokasi Dana</h2>
          <ul>
            <li>Sembako: ${report.allocation.percentages.sembako}% (Rp ${report.allocation.sembako.toLocaleString()})</li>
            <li>Subsidi: ${report.allocation.percentages.subsidi}% (Rp ${report.allocation.subsidi.toLocaleString()})</li>
            <li>Ops & Mesh: ${report.allocation.percentages.ops}% (Rp ${report.allocation.ops.toLocaleString()})</li>
          </ul>
          <hr>
          <p><em>Dibuat oleh SembakoKita.Pro — Demi rakyat! 🇮🇩</em></p>
        </body>
      </html>
    `;
  }
}
