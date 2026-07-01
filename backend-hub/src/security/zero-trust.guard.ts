// ============================================
// ZERO-TRUST.GUARD.TS — SembakoKita.Pro
// ============================================
// Tugas:
// 1. Zero-trust authentication
// 2. Token validation
// 3. Rate limiting & anti-DDoS
// ============================================

import { Injectable, CanActivate, ExecutionContext, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import * as crypto from 'crypto';

@Injectable()
export class ZeroTrustGuard implements CanActivate {
  private readonly logger = new Logger(ZeroTrustGuard.name);
  private readonly requestLog: Map<string, number[]> = new Map();
  private readonly MAX_REQUESTS = 100;
  private readonly TIME_WINDOW = 60000; // 1 menit

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const ip = request.ip || 'unknown';

    // 1. Rate limiting
    if (!this.checkRateLimit(ip)) {
      this.logger.warn(`⚠️ Rate limit exceeded: ${ip}`);
      return false;
    }

    // 2. Check token (jika ada)
    const token = request.headers['authorization'];
    if (token && !this.validateToken(token)) {
      this.logger.warn(`⚠️ Invalid token: ${ip}`);
      return false;
    }

    // 3. Check signature (jika ada)
    const signature = request.headers['x-signature'];
    const body = request.body;
    if (signature && body) {
      if (!this.validateSignature(body, signature)) {
        this.logger.warn(`⚠️ Invalid signature: ${ip}`);
        return false;
      }
    }

    return true;
  }

  // ============================================
  // RATE LIMITING
  // ============================================
  private checkRateLimit(ip: string): boolean {
    const now = Date.now();
    const requests = this.requestLog.get(ip) || [];
    const validRequests = requests.filter(t => now - t < this.TIME_WINDOW);

    if (validRequests.length >= this.MAX_REQUESTS) {
      return false;
    }

    validRequests.push(now);
    this.requestLog.set(ip, validRequests);
    return true;
  }

  // ============================================
  // TOKEN VALIDATION
  // ============================================
  private validateToken(token: string): boolean {
    // Format: "Bearer <token>"
    const parts = token.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return false;
    }

    const tokenValue = parts[1];
    // Validasi sederhana: token minimal 32 karakter
    return tokenValue.length >= 32;
  }

  // ============================================
  // SIGNATURE VALIDATION
  // ============================================
  private validateSignature(body: any, signature: string): boolean {
    const secret = process.env.SIGNATURE_SECRET || 'sembako-kita-secret';
    const computed = crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(body))
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(computed)
    );
  }

  // ============================================
  // GET STATS
  // ============================================
  getStats() {
    return {
      totalRequests: Array.from(this.requestLog.values()).reduce((a, b) => a + b.length, 0),
      uniqueIps: this.requestLog.size,
      rateLimited: Array.from(this.requestLog.values()).filter(v => v.length > this.MAX_REQUESTS).length,
    };
  }
}
