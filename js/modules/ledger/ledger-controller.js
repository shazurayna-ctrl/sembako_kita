// web-pwa/js/modules/ledger/ledger-controller.js
// Blockchain lokal (mini blockchain)

export class LedgerController {
  constructor() {
    this.blocks = [];
    this.totalBlocks = 1251;
    this.status = 'Valid';
    this.loadFromStorage();
  }

  loadFromStorage() {
    try {
      const saved = localStorage.getItem('ledgerData');
      if (saved) {
        const data = JSON.parse(saved);
        this.blocks = data.blocks || [];
        this.totalBlocks = data.totalBlocks || 1251;
      } else {
        // Data default
        this.blocks = [
          { id: '#1', items: 3, total: 31700, donasi: 4755, prev: '0'.repeat(64), hash: '0000...29cfcfe7', time: '2026-06-28T12:59:51.541Z' },
          { id: '#2', items: 6, total: 83700, donasi: 12555, prev: '0000...29cfcfe7', hash: '0000...2135624', time: '2026-06-28T14:01:21.269Z' },
          { id: '#3', items: 0, total: 83700, donasi: 12555, prev: '0000...2135624', hash: '0000...21c7700', time: '2026-06-28T14:01:23.483Z' },
          { id: '#4', items: 5, total: 87700, donasi: 13155, prev: '0000...21c7700', hash: '0000...23c6dc7', time: '2026-06-29T02:47:47.960Z' }
        ];
        this.saveToStorage();
      }
    } catch (e) {
      console.error('[LEDGER] Load error:', e);
    }
  }

  saveToStorage() {
    try {
      localStorage.setItem('ledgerData', JSON.stringify({
        blocks: this.blocks,
        totalBlocks: this.totalBlocks
      }));
    } catch (e) {
      console.error('[LEDGER] Save error:', e);
    }
  }

  addBlock(data) {
    const prevHash = this.blocks.length > 0 ? this.blocks[this.blocks.length - 1].hash : '0'.repeat(64);
    const block = {
      id: `#${this.blocks.length + 1}`,
      items: data.items || 0,
      total: data.total || 0,
      donasi: data.donasi || 0,
      prev: prevHash,
      hash: this.generateHash(data),
      time: new Date().toISOString()
    };
    this.blocks.push(block);
    this.totalBlocks += 1;
    this.saveToStorage();
    return block;
  }

  generateHash(data) {
    // Simulasi hash (SHA-256 simplified)
    const str = JSON.stringify(data) + Date.now() + Math.random();
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return '0000' + Math.abs(hash).toString(16).padStart(60, '0');
  }

  getBlocks(limit = 10) {
    return this.blocks.slice(-limit).reverse();
  }

  getStats() {
    return {
      totalBlocks: this.totalBlocks,
      hashAlgorithm: 'SHA-256',
      status: this.status,
      lastBlock: this.blocks[this.blocks.length - 1]
    };
  }

  verify() {
    // Verifikasi blockchain
    for (let i = 1; i < this.blocks.length; i++) {
      if (this.blocks[i].prev !== this.blocks[i - 1].hash) {
        this.status = 'Invalid';
        return false;
      }
    }
    this.status = 'Valid';
    return true;
  }
}
