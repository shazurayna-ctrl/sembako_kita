// web-pwa/js/operational/funding/funding-controller.js
// Manajemen pendanaan posko

import { supabase } from '../../core/supabase.js';

export class FundingController {
  constructor() {
    this.data = {
      saldo: 24743020,
      retailBulanIni: 8486800,
      donasiOnline: 3100000,
      csrPending: 15000000,
      allocations: {
        sembako: 50,
        subsidi: 30,
        ops: 20
      },
      sources: [
        { id: 1, name: 'Retail Cashier (15% margin)', status: 'Aktif', amount: 8486800 },
        { id: 2, name: 'CSR Jababeka/MM2100', status: 'Pending', amount: 15000000 },
        { id: 3, name: 'KitaBisa Crowdfunding', status: 'Online', amount: 3100000, progress: 62 },
        { id: 4, name: 'Dana Desa (ADD) / DSP BPBD', status: 'Draft', amount: 0 },
        { id: 5, name: 'Hibah WFP/UN', status: 'Belum', amount: 0 }
      ],
      audit: []
    };
    this.loadFromStorage();
  }

  loadFromStorage() {
    try {
      const saved = localStorage.getItem('fundingData');
      if (saved) {
        this.data = JSON.parse(saved);
      }
    } catch (e) {
      console.error('[FUNDING] Load error:', e);
    }
  }

  saveToStorage() {
    try {
      localStorage.setItem('fundingData', JSON.stringify(this.data));
    } catch (e) {
      console.error('[FUNDING] Save error:', e);
    }
  }

  getSaldo() {
    return this.data.saldo;
  }

  getSources() {
    return this.data.sources;
  }

  getAllocation() {
    const total = this.data.saldo;
    return {
      sembako: Math.round(total * this.data.allocations.sembako / 100),
      subsidi: Math.round(total * this.data.allocations.subsidi / 100),
      ops: Math.round(total * this.data.allocations.ops / 100),
      percentages: this.data.allocations
    };
  }

  addTransaction(transaction) {
    transaction.id = Date.now().toString(36);
    transaction.waktu = new Date().toISOString();
    this.data.audit.unshift(transaction);
    
    if (transaction.type === 'masuk') {
      this.data.saldo += transaction.amount;
    } else {
      this.data.saldo -= transaction.amount;
    }
    
    this.saveToStorage();
    this.syncToSupabase(transaction);
    return transaction;
  }

  async syncToSupabase(transaction) {
    try {
      await supabase.insert('funding_audit', transaction);
    } catch (e) {
      console.warn('[FUNDING] Sync error:', e);
    }
  }

  getAudit(limit = 20) {
    return this.data.audit.slice(0, limit);
  }

  getStats() {
    return {
      saldo: this.data.saldo,
      retail: this.data.retailBulanIni,
      donasi: this.data.donasiOnline,
      csr: this.data.csrPending,
      totalTransaksi: this.data.audit.length
    };
  }
}
