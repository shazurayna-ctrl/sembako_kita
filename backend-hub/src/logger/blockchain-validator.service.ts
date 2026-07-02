// ============================================
// BLOCKCHAIN-VALIDATOR.SERVICE.TS
// ============================================
// Tugas:
// 1. Validasi integritas ledger chain
// 2. Verifikasi hash antar blok
// 3. Deteksi manipulasi data
// ============================================

import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';

export interface LedgerBlock {
  index: number;
  data: string;
  timestamp: string;
  prevHash: string;
  hash: string;
  nonce: number;
}

@Injectable()
export class BlockchainValidatorService {
  private readonly logger = new Logger(BlockchainValidatorService.name);
  private chain: LedgerBlock[] = [];
  private readonly DIFFICULTY = 2; // Jumlah leading zeros

  constructor() {
    this.initGenesisBlock();
  }

  // ============================================
  // GENESIS BLOCK
  // ============================================
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
    this.logger.log('🔗 Genesis block created');
  }

  // ============================================
  // TAMBAH BLOK
  // ============================================
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
    this.logger.log(`📦 Block #${newBlock.index} added: ${data.substring(0, 30)}...`);
    return newBlock;
  }

  // ============================================
  // MINING (Proof of Work)
  // ============================================
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

  // ============================================
  // HASH
  // ============================================
  private hashBlock(block: LedgerBlock): string {
    const data = `${block.index}${block.data}${block.timestamp}${block.prevHash}${block.nonce}`;
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  // ============================================
  // VALIDASI CHAIN
  // ============================================
  validate(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    for (let i = 1; i < this.chain.length; i++) {
      const current = this.chain[i];
      const previous = this.chain[i - 1];

      // Cek prevHash
      if (current.prevHash !== previous.hash) {
        errors.push(`Block #${i}: prevHash mismatch`);
      }

      // Cek hash
      const computedHash = this.hashBlock(current);
      if (current.hash !== computedHash) {
        errors.push(`Block #${i}: hash mismatch`);
      }

      // Cek difficulty
      if (!current.hash.startsWith('0'.repeat(this.DIFFICULTY))) {
        errors.push(`Block #${i}: invalid difficulty`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  // ============================================
  // GET CHAIN
  // ============================================
  getChain(limit: number = 10): LedgerBlock[] {
    return this.chain.slice(-limit).reverse();
  }

  getFullChain(): LedgerBlock[] {
    return this.chain;
  }

  // ============================================
  // GET STATS
  // ============================================
  getStats() {
    const validation = this.validate();
    return {
      totalBlocks: this.chain.length,
      valid: validation.valid,
      errors: validation.errors,
      lastBlock: this.chain[this.chain.length - 1],
      genesis: this.chain[0],
      difficulty: this.DIFFICULTY,
    };
  }
}
