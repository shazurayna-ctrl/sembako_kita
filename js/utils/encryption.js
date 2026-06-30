// web-pwa/js/utils/encryption.js
// Enkripsi data lokal: AES-256 + SHA-256

export class Encryption {
  constructor() {
    this.salt = 'SembakoKita2026';
    this.algorithm = 'AES-GCM';
  }

  // 🔐 Generate hash SHA-256
  async hash(text) {
    const encoder = new TextEncoder();
    const data = encoder.encode(text + this.salt);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // 🔐 Enkripsi data
  async encrypt(data, password = 'default') {
    try {
      const encoder = new TextEncoder();
      const keyMaterial = await this.deriveKey(password);
      
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const encrypted = await crypto.subtle.encrypt(
        { name: this.algorithm, iv: iv },
        keyMaterial,
        encoder.encode(JSON.stringify(data))
      );

      const result = {
        iv: Array.from(iv),
        data: Array.from(new Uint8Array(encrypted))
      };

      return btoa(JSON.stringify(result));
    } catch (error) {
      console.error('[ENCRYPT] Error:', error);
      return null;
    }
  }

  // 🔐 Dekripsi data
  async decrypt(encryptedData, password = 'default') {
    try {
      const decoder = new TextDecoder();
      const parsed = JSON.parse(atob(encryptedData));
      
      const keyMaterial = await this.deriveKey(password);
      const iv = new Uint8Array(parsed.iv);
      const data = new Uint8Array(parsed.data);

      const decrypted = await crypto.subtle.decrypt(
        { name: this.algorithm, iv: iv },
        keyMaterial,
        data
      );

      return JSON.parse(decoder.decode(decrypted));
    } catch (error) {
      console.error('[ENCRYPT] Error:', error);
      return null;
    }
  }

  // 🔑 Derive key dari password
  async deriveKey(password) {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password + this.salt),
      'PBKDF2',
      false,
      ['deriveKey']
    );

    return await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: encoder.encode(this.salt),
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: this.algorithm, length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  // 🎫 Generate token unik (untuk Sembako Token)
  generateToken() {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 10);
    const combined = timestamp + random;
    return this.hash(combined);
  }

  // 🔑 Generate kunci unik untuk transaksi
  generateKey() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // 📦 Enkripsi objek (wrapper)
  async encryptObject(obj, password = 'default') {
    return await this.encrypt(obj, password);
  }

  // 📦 Dekripsi objek (wrapper)
  async decryptObject(encrypted, password = 'default') {
    return await this.decrypt(encrypted, password);
  }

  // ✅ Verifikasi hash (untuk password/login)
  async verifyHash(input, storedHash) {
    const inputHash = await this.hash(input);
    return inputHash === storedHash;
  }
}

// Export singleton
export const encryption = new Encryption();
