// ============================================
// ENCRYPTION.JS — SembakoKita.Pro v2026.07.01
// ============================================
// Enkripsi data lokal: AES-256-GCM + SHA-256
// ============================================

export class Encryption {
  constructor() {
    this.salt = 'SembakoKita2026';
    this.algorithm = 'AES-GCM';
    this.encoder = new TextEncoder();
    this.decoder = new TextDecoder();
  }

  // ============================================
  // HASH — SHA-256
  // ============================================
  async hash(text) {
    try {
      const data = this.encoder.encode(text + this.salt);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (error) {
      console.error('[ENCRYPT] Hash error:', error);
      // Fallback: simple hash
      let hash = 0;
      for (let i = 0; i < text.length; i++) {
        const char = text.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
      }
      return 'fallback_' + Math.abs(hash).toString(16).padStart(64, '0');
    }
  }

  // ============================================
  // ENKRIPSI — AES-256-GCM
  // ============================================
  async encrypt(data, password = 'default') {
    try {
      const keyMaterial = await this.deriveKey(password);
      const iv = crypto.getRandomValues(new Uint8Array(12));
      
      const encrypted = await crypto.subtle.encrypt(
        { name: this.algorithm, iv: iv },
        keyMaterial,
        this.encoder.encode(JSON.stringify(data))
      );

      const result = {
        iv: Array.from(iv),
        data: Array.from(new Uint8Array(encrypted))
      };

      return btoa(JSON.stringify(result));
    } catch (error) {
      console.error('[ENCRYPT] Encrypt error:', error);
      return null;
    }
  }

  // ============================================
  // DEKRIPSI — AES-256-GCM
  // ============================================
  async decrypt(encryptedData, password = 'default') {
    try {
      const parsed = JSON.parse(atob(encryptedData));
      const keyMaterial = await this.deriveKey(password);
      const iv = new Uint8Array(parsed.iv);
      const data = new Uint8Array(parsed.data);

      const decrypted = await crypto.subtle.decrypt(
        { name: this.algorithm, iv: iv },
        keyMaterial,
        data
      );

      return JSON.parse(this.decoder.decode(decrypted));
    } catch (error) {
      console.error('[ENCRYPT] Decrypt error:', error);
      return null;
    }
  }

  // ============================================
  // DERIVE KEY — PBKDF2
  // ============================================
  async deriveKey(password) {
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      this.encoder.encode(password + this.salt),
      'PBKDF2',
      false,
      ['deriveKey']
    );

    return await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: this.encoder.encode(this.salt),
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: this.algorithm, length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  // ============================================
  // TOKEN — Generate Token Unik
  // ============================================
  async generateToken() {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 10);
    const combined = timestamp + random;
    return await this.hash(combined);
  }

  // ============================================
  // KEY — Generate Kunci Acak
  // ============================================
  generateKey() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // ============================================
  // VERIFY — Verifikasi Hash
  // ============================================
  async verifyHash(input, storedHash) {
    const inputHash = await this.hash(input);
    return inputHash === storedHash;
  }

  // ============================================
  // WRAPPER — Enkripsi Objek
  // ============================================
  async encryptObject(obj, password = 'default') {
    return await this.encrypt(obj, password);
  }

  // ============================================
  // WRAPPER — Dekripsi Objek
  // ============================================
  async decryptObject(encrypted, password = 'default') {
    return await this.decrypt(encrypted, password);
  }
}

// Export singleton
export const encryption = new Encryption();
