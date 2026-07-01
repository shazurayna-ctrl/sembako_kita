// ============================================
// SEMBAKO-TOKEN.SERVICE.TS — SembakoKita.Pro
// ============================================
// Tugas:
// 1. Generate token unik untuk setiap transaksi
// 2. Validasi token (anti-manipulasi)
// 3. QR Code encoding/decoding
// ============================================

import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import * as QRCode from 'qrcode';

export interface SembakoToken {
  id: string;
  type: 'payment' | 'barter' | 'distribusi' | 'sos';
  data: Record<string, any>;
  signature: string;
  timestamp: string;
  expiresAt: string;
  qrCode: string;
}

@Injectable()
export class SembakoTokenService {
  private readonly logger = new Logger(SembakoTokenService.name);
  private readonly SECRET = process.env.TOKEN_SECRET || 'sembako-kita-2026';
  private tokens: Map<string, SembakoToken> = new Map();

  // ============================================
  // GENERATE TOKEN
  // ============================================
  generate(data: Record<string, any>, type: SembakoToken['type']): SembakoToken {
    const id = this.generateId();
    const timestamp = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 jam

    const tokenData: Omit<SembakoToken, 'qrCode' | 'signature'> = {
      id,
      type,
      data,
      timestamp,
      expiresAt,
    };

    const signature = this.sign(tokenData);
    const qrCode = this.generateQR(id);

    const token: SembakoToken = {
      ...tokenData,
      signature,
      qrCode,
    };

    this.tokens.set(id, token);
    this.logger.log(`🎫 Token generated: ${id} (${type})`);

    return token;
  }

  // ============================================
  // VALIDASI TOKEN
  // ============================================
  validate(tokenId: string, qrCode: string): {
    valid: boolean;
    token?: SembakoToken;
    error?: string;
  } {
    const token = this.tokens.get(tokenId);
    if (!token) {
      return { valid: false, error: 'Token tidak ditemukan' };
    }

    // Cek QR Code
    if (token.qrCode !== qrCode) {
      return { valid: false, error: 'QR Code tidak valid' };
    }

    // Cek kadaluarsa
    if (new Date(token.expiresAt) < new Date()) {
      return { valid: false, error: 'Token sudah kadaluarsa' };
    }

    // Cek signature
    const { signature, qrCode: _, ...tokenData } = token;
    const expectedSignature = this.sign(tokenData);
    if (signature !== expectedSignature) {
      return { valid: false, error: 'Signature tidak valid (data dimanipulasi)' };
    }

    return { valid: true, token };
  }

  // ============================================
  // SIGNATURE
  // ============================================
  private sign(data: any): string {
    const str = JSON.stringify(data) + this.SECRET;
    return crypto.createHash('sha256').update(str).digest('hex');
  }

  // ============================================
  // QR CODE
  // ============================================
  private generateQR(id: string): string {
    // Simulasi QR Code (bisa diganti dengan library qrcode)
    return `QR:${id}:${Date.now()}`;
  }

  async generateQRImage(id: string): Promise<string> {
    const token = this.tokens.get(id);
    if (!token) throw new Error('Token tidak ditemukan');

    const qrData = JSON.stringify({
      id: token.id,
      type: token.type,
      signature: token.signature,
    });

    try {
      return await QRCode.toDataURL(qrData);
    } catch (error) {
      this.logger.error('QR Code generation failed:', error);
      return '';
    }
  }

  // ============================================
  // UTILITY
  // ============================================
  private generateId(): string {
    return 'SK_' + Date.now().toString(36) + '_' + crypto.randomBytes(4).toString('hex');
  }

  getToken(id: string): SembakoToken | null {
    return this.tokens.get(id) || null;
  }

  getAllTokens(): SembakoToken[] {
    return Array.from(this.tokens.values());
  }

  revoke(id: string): boolean {
    return this.tokens.delete(id);
  }
}
