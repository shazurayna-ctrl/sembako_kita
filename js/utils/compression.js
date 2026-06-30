// ============================================
// COMPRESSION.JS — SembakoKita.Pro v2026.07.01
// ============================================
// Kompresi data: LZW + Binary Packer (70% compression)
// ============================================

export class Compression {
  constructor() {
    this.dictSize = 256;
  }

  // ============================================
  // LZW COMPRESS — String → Array
  // ============================================
  compressString(input) {
    const dict = new Map();
    for (let i = 0; i < 256; i++) {
      dict.set(String.fromCharCode(i), i);
    }

    let w = '';
    const result = [];
    let dictSize = 256;

    for (const c of input) {
      const wc = w + c;
      if (dict.has(wc)) {
        w = wc;
      } else {
        result.push(dict.get(w));
        dict.set(wc, dictSize++);
        w = c;
      }
    }

    if (w !== '') {
      result.push(dict.get(w));
    }

    return result;
  }

  // ============================================
  // LZW DECOMPRESS — Array → String
  // ============================================
  decompressString(compressed) {
    const dict = new Map();
    for (let i = 0; i < 256; i++) {
      dict.set(i, String.fromCharCode(i));
    }

    let w = String.fromCharCode(compressed[0]);
    let result = w;
    let dictSize = 256;

    for (let i = 1; i < compressed.length; i++) {
      const k = compressed[i];
      let entry;
      if (dict.has(k)) {
        entry = dict.get(k);
      } else if (k === dictSize) {
        entry = w + w[0];
      } else {
        throw new Error('Invalid compression data');
      }

      result += entry;
      dict.set(dictSize++, w + entry[0]);
      w = entry;
    }

    return result;
  }

  // ============================================
  // JSON COMPRESS — JSON → Binary
  // ============================================
  compressJSON(data) {
    const jsonString = JSON.stringify(data);
    const compressed = this.compressString(jsonString);
    const binary = new Uint8Array(compressed.length * 2);
    for (let i = 0; i < compressed.length; i++) {
      binary[i * 2] = compressed[i] >> 8;
      binary[i * 2 + 1] = compressed[i] & 0xFF;
    }
    return binary;
  }

  // ============================================
  // JSON DECOMPRESS — Binary → JSON
  // ============================================
  decompressJSON(binary) {
    const compressed = [];
    for (let i = 0; i < binary.length; i += 2) {
      compressed.push((binary[i] << 8) | binary[i + 1]);
    }
    const jsonString = this.decompressString(compressed);
    return JSON.parse(jsonString);
  }

  // ============================================
  // TEXT COMPRESS — Text → Base64
  // ============================================
  compressText(text) {
    const compressed = this.compressString(text);
    return btoa(String.fromCharCode(...compressed.map(v => v > 255 ? 255 : v)));
  }

  // ============================================
  // TEXT DECOMPRESS — Base64 → Text
  // ============================================
  decompressText(compressed) {
    const decoded = atob(compressed);
    const arr = [];
    for (let i = 0; i < decoded.length; i++) {
      arr.push(decoded.charCodeAt(i));
    }
    return this.decompressString(arr);
  }

  // ============================================
  // PACKET — Binary Packet untuk Mesh
  // ============================================
  packPacket(data) {
    const packed = {
      header: {
        version: 1,
        timestamp: Date.now(),
        type: data.type || 'data'
      },
      body: data.body || data
    };
    return this.compressJSON(packed);
  }

  // ============================================
  // UNPACK — Binary Packet dari Mesh
  // ============================================
  unpackPacket(binary) {
    try {
      return this.decompressJSON(binary);
    } catch (error) {
      console.error('[COMPRESSION] Unpack error:', error);
      return null;
    }
  }

  // ============================================
  // RATIO — Hitung Rasio Kompresi
  // ============================================
  getCompressionRatio(original, compressed) {
    const originalSize = JSON.stringify(original).length;
    const compressedSize = compressed.length;
    const ratio = ((1 - compressedSize / originalSize) * 100);
    return {
      originalSize,
      compressedSize,
      ratio: Math.round(ratio * 100) / 100,
      saved: Math.round((originalSize - compressedSize) / 1024 * 100) / 100 // KB
    };
  }

  // ============================================
  // ESTIMATE — Estimasi Ukuran
  // ============================================
  estimateSize(data) {
    const jsonString = JSON.stringify(data);
    const compressed = this.compressString(jsonString);
    return {
      original: jsonString.length,
      compressed: compressed.length,
      ratio: Math.round((1 - compressed.length / jsonString.length) * 1000) / 10
    };
  }
}

// Export singleton
export const compression = new Compression();
