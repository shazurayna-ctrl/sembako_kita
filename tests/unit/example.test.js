// ============================================
// EXAMPLE.TEST.JS — SembakoKita.Pro Unit Tests
// ============================================
// Tugas: Contoh unit test untuk komponen core
// ============================================

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { LocalBrain } from '../../web-pwa/js/agent/local-brain.js';
import { DeviceHealth } from '../../web-pwa/js/adapters/device-health.js';
import { Validator } from '../../web-pwa/js/utils/validator.js';
import { encryption } from '../../web-pwa/js/utils/encryption.js';
import { compression } from '../../web-pwa/js/utils/compression.js';

// ============================================
// TEST: VALIDATOR
// ============================================
describe('Validator', () => {
  const validator = new Validator();

  it('should validate email correctly', () => {
    expect(validator.validate('test@email.com', 'email').valid).toBe(true);
    expect(validator.validate('invalid-email', 'email').valid).toBe(false);
  });

  it('should validate phone number correctly', () => {
    expect(validator.validate('08123456789', 'phone').valid).toBe(true);
    expect(validator.validate('123', 'phone').valid).toBe(false);
  });

  it('should sanitize dangerous input', () => {
    const input = '<script>alert("xss")</script>';
    const sanitized = validator.sanitize(input);
    expect(sanitized).not.toContain('<script>');
  });

  it('should validate report', () => {
    const report = { text: 'Kelangkaan beras RW 07' };
    const result = validator.validateReport(report);
    expect(result.valid).toBe(true);
  });

  it('should reject empty report', () => {
    const report = { text: '' };
    const result = validator.validateReport(report);
    expect(result.valid).toBe(false);
  });
});

// ============================================
// TEST: ENCRYPTION
// ============================================
describe('Encryption', () => {
  it('should encrypt and decrypt data', async () => {
    const data = { message: 'SembakoKita.Pro', timestamp: Date.now() };
    const encrypted = await encryption.encrypt(data, 'password123');
    const decrypted = await encryption.decrypt(encrypted, 'password123');
    expect(decrypted).toEqual(data);
  });

  it('should generate unique hash', async () => {
    const hash1 = await encryption.hash('test');
    const hash2 = await encryption.hash('test');
    expect(hash1).toBe(hash2);
  });

  it('should generate token', async () => {
    const token = await encryption.generateToken();
    expect(token).toBeDefined();
    expect(token.length).toBeGreaterThan(10);
  });
});

// ============================================
// TEST: COMPRESSION
// ============================================
describe('Compression', () => {
  it('should compress and decompress string', () => {
    const text = 'SembakoKita.Pro Ekosistem Krisis Pangan';
    const compressed = compression.compressText(text);
    const decompressed = compression.decompressText(compressed);
    expect(decompressed).toBe(text);
  });

  it('should compress and decompress JSON', () => {
    const data = { items: ['beras', 'minyak', 'gula'], total: 100 };
    const binary = compression.compressJSON(data);
    const result = compression.decompressJSON(binary);
    expect(result).toEqual(data);
  });

  it('should calculate compression ratio', () => {
    const data = { test: 'data', array: Array(100).fill('x') };
    const binary = compression.compressJSON(data);
    const ratio = compression.getCompressionRatio(data, binary);
    expect(ratio.ratio).toBeGreaterThan(0);
  });
});

// ============================================
// TEST: DEVICE HEALTH
// ============================================
describe('DeviceHealth', () => {
  const device = new DeviceHealth();

  it('should detect device info', async () => {
    const info = await device.detect();
    expect(info).toHaveProperty('ram');
    expect(info).toHaveProperty('battery');
    expect(info).toHaveProperty('android');
  });

  it('should return mode based on device', async () => {
    const mode = device.getMode();
    expect(['normal', 'krisis', 'survival']).toContain(mode);
  });

  it('should return recommendations', async () => {
    const rec = device.getRecommendation();
    expect(rec).toHaveProperty('fitur');
    expect(rec).toHaveProperty('animasi');
    expect(rec).toHaveProperty('sync');
  });
});

// ============================================
// TEST: LOCAL BRAIN (AI)
// ============================================
describe('LocalBrain', () => {
  let brain;

  beforeEach(() => {
    brain = new LocalBrain({
      mode: 'auto',
      securityLevel: 'maximum',
      voiceEnabled: false
    });
  });

  it('should initialize correctly', async () => {
    const context = await brain.init();
    expect(context).toHaveProperty('mode');
    expect(context).toHaveProperty('deviceInfo');
  });

  it('should process chat messages', async () => {
    const response = await brain.process('Cek stok beras', 'text');
    expect(response).toBeDefined();
    expect(response).toContain('Beras');
  });

  it('should handle SOS command', async () => {
    const response = await brain.process('sos darurat', 'text');
    expect(response).toContain('SOS');
    expect(response).toContain('darurat');
  });

  it('should handle report command', async () => {
    const response = await brain.process('laporan kelangkaan beras RW 07', 'text');
    expect(response).toContain('laporan');
  });

  it('should detect device mode', () => {
    const mode = brain.device.getMode();
    expect(['normal', 'krisis', 'survival']).toContain(mode);
  });
});
