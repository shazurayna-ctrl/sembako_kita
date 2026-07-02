// ============================================
// BLOCKCHAIN-VALIDATOR.SERVICE.TS
// ============================================
// Tugas: Validasi integritas ledger chain (TANPA Logger)
// ============================================

export interface LedgerBlock {
  index: number;
  data: string;
  timestamp: string;
  prevHash: string;
  hash: string;
  nonce: number;
}

export class BlockchainValidatorService {
  private chain: LedgerBlock[] = [];
  private readonly DIFFICULTY = 2;

  constructor() {
    this.initGenesisBlock();
    console.log('🔗 Genesis block created');
  }

  private initGenesisBlock() {
    const genesis: LedgerBlock = {
      index: 0,
      data: 'Genesis Block — SembakoKita.Pro',
      timestamp: new Date().toISOString(),
      prevHash: '0'.repeat(64),
      hash: '',
      nonce: 0,
    };
    genesis.hash = this.mine(genesis);
    this.chain.push(genesis);
  }

  addBlock(data: string): LedgerBlock {
    const prevBlock = this.chain[this.chain.length - 1];
    const newBlock: LedgerBlock = {
      index: prevBlock.index + 1,
      data,
      timestamp: new Date().toISOString(),
      prevHash: prevBlock.hash,
      hash: '',
      nonce: 0,
    };
    newBlock.hash = this.mine(newBlock);
    this.chain.push(newBlock);
    console.log(`📦 Block #${newBlock.index} added`);
    return newBlock;
  }

  private mine(block: LedgerBlock): string {
    let nonce = 0;
    let hash = '';
    while (true) {
      const testBlock = { ...block, nonce };
      hash = this.hashBlock(testBlock);
      if (hash.startsWith('0'.repeat(this.DIFFICULTY))) {
        block.nonce = nonce;
        break;
      }
      nonce++;
    }
    return hash;
  }

  private hashBlock(block: LedgerBlock): string {
    const data = `${block.index}${block.data}${block.timestamp}${block.prevHash}${block.nonce}`;
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16).padStart(64, '0');
  }

  validate(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    for (let i = 1; i < this.chain.length; i++) {
      const current = this.chain[i];
      const previous = this.chain[i - 1];
      if (current.prevHash !== previous.hash) {
        errors.push(`Block #${i}: prevHash mismatch`);
      }
      const computedHash = this.hashBlock(current);
      if (current.hash !== computedHash) {
        errors.push(`Block #${i}: hash mismatch`);
      }
      if (!current.hash.startsWith('0'.repeat(this.DIFFICULTY))) {
        errors.push(`Block #${i}: invalid difficulty`);
      }
    }
    return { valid: errors.length === 0, errors };
  }

  getChain(limit: number = 10): LedgerBlock[] {
    return this.chain.slice(-limit).reverse();
  }

  getStats() {
    const validation = this.validate();
    return {
      totalBlocks: this.chain.length,
      valid: validation.valid,
      errors: validation.errors,
      lastBlock: this.chain[this.chain.length - 1],
      difficulty: this.DIFFICULTY,
    };
  }
}
