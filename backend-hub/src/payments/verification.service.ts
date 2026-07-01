// ============================================
// VERIFICATION.SERVICE.TS — SembakoKita.Pro
// ============================================
// Tugas:
// 1. Verifikasi bukti transfer QRIS
// 2. Validasi nominal & timestamp
// 3. Cegah duplikasi transaksi
// ============================================

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

export interface PaymentVerification {
  id: string;
  amount: number;
  timestamp: string;
  qrCode: string;
  status: 'pending' | 'verified' | 'failed';
  verifiedBy: string;
}

@Injectable()
export class PaymentVerificationService {
  private readonly logger = new Logger(PaymentVerificationService.name);
  private readonly cache = new Map<string, PaymentVerification>();

  constructor(private configService: ConfigService) {}

  // ============================================
  // VERIFIKASI UTAMA
  // ============================================
  async verify(paymentData: {
    transactionId: string;
    nominal: number;
    qrImage: string;
    timestamp: string;
  }): Promise<PaymentVerification> {
    this.logger.log(`🔍 Verifying payment: ${paymentData.transactionId}`);

    // 1. Cek duplikasi
    if (this.cache.has(paymentData.transactionId)) {
      throw new Error('Transaksi duplikat terdeteksi!');
    }

    // 2. Validasi nominal
    if (paymentData.nominal <= 0) {
      throw new Error('Nominal tidak valid!');
    }

    // 3. Validasi timestamp
    const txTime = new Date(paymentData.timestamp);
    const now = new Date();
    if ((now.getTime() - txTime.getTime()) > 300000) { // 5 menit
      throw new Error('Timestamp kadaluarsa!');
    }

    // 4. Simulasikan verifikasi QRIS (Integrasi ke Midtrans/QRIS API)
    const verificationResult = await this.verifyQRIS(paymentData.qrImage);

    const result: PaymentVerification = {
      id: paymentData.transactionId,
      amount: paymentData.nominal,
      timestamp: paymentData.timestamp,
      qrCode: paymentData.qrImage.substring(0, 50) + '...',
      status: verificationResult ? 'verified' : 'failed',
      verifiedBy: 'SembakoKita.Pro AI',
    };

    this.cache.set(paymentData.transactionId, result);
    this.logger.log(`✅ Payment ${result.status}: ${paymentData.transactionId}`);

    return result;
  }

  // ============================================
  // SIMULASI VERIFIKASI QRIS
  // ============================================
  private async verifyQRIS(qrImage: string): Promise<boolean> {
    // Simulasi: cek pattern QRIS (bisa diganti dengan API Midtrans/QRIS)
    const validPatterns = ['qris', 'sembako', 'pay'];
    const lower = qrImage.toLowerCase();
    return validPatterns.some(p => lower.includes(p));
  }

  // ============================================
  // CEK STATUS TRANSAKSI
  // ============================================
  getStatus(transactionId: string): PaymentVerification | null {
    return this.cache.get(transactionId) || null;
  }

  // ============================================
  // GET ALL VERIFIED
  // ============================================
  getAllVerified(): PaymentVerification[] {
    return Array.from(this.cache.values()).filter(v => v.status === 'verified');
  }
}
