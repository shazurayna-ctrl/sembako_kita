// ============================================
// BINARY-PACKER.SERVICE.TS — SembakoKita.Pro
// ============================================
// Tugas:
// 1. Kompresi data menjadi binary
// 2. Dekompresi binary ke JSON
// 3. Optimasi ukuran packet (70% compression)
// ============================================

import { Injectable, Logger } from '@nestjs/common';
import * as zlib from 'zlib';
import { promisify } from 'util';

const gzip = promisify(zlib.gzip);
const gunzip = promisify(zlib.gunzip);

@Injectable()
export class BinaryPackerService {
  private readonly logger = new Logger(BinaryPackerService.name);
  private readonly dictionary = new Map<string, number>();

  // ============================================
  // PACK — JSON → Binary
  // ============================================
  async pack(data: any): Promise<Buffer> {
    const startTime = Date.now();

    // 1. JSON stringify
    const jsonString = JSON.stringify(data);

    // 2. LZW Compression
    const compressed = this.lzwCompress(jsonString);

    // 3. Convert to Buffer
    const buffer = Buffer.from(compressed);

    // 4. GZIP (opsional, untuk ukuran lebih kecil)
    const gzipped = await gzip(buffer);

    const size = {
      original: jsonString.length,
      compressed: gzipped.length,
      ratio: ((1 - gzipped.length / jsonString.length) * 100).toFixed(1) + '%',
    };

    this.logger.log(`📦 Packed: ${size.original} → ${size.compressed} bytes (${size.ratio})`);

    return gzipped;
  }

  // ============================================
  // UNPACK — Binary → JSON
  // ============================================
  async unpack(buffer: Buffer): Promise<any> {
    try {
      // 1. Gunzip
      const decompressed = await gunzip(buffer);

      // 2. Convert to string
      const compressedString = decompressed.toString('utf8');

      // 3. LZW Decompress
      const jsonString = this.lzwDecompress(compressedString);

      // 4. Parse JSON
      return JSON.parse(jsonString);
    } catch (error) {
      this.logger.error('❌ Unpack failed:', error);
      throw new Error('Data corrupt or invalid');
    }
  }

  // ============================================
  // LZW COMPRESS
  // ============================================
  private lzwCompress(input: string): string {
    const dict = new Map<string, number>();
    for (let i = 0; i < 256; i++) {
      dict.set(String.fromCharCode(i), i);
    }

    let w = '';
    const result: number[] = [];
    let dictSize = 256;

    for (const c of input) {
      const wc = w + c;
      if (dict.has(wc)) {
        w = wc;
      } else {
        result.push(dict.get(w)!);
        dict.set(wc, dictSize++);
        w = c;
      }
    }

    if (w !== '') {
      result.push(dict.get(w)!);
    }

    return String.fromCharCode(...result.map(v => v > 255 ? 255 : v));
  }

  // ============================================
  // LZW DECOMPRESS
  // ============================================
  private lzwDecompress(input: string): string {
    const dict = new Map<number, string>();
    for (let i = 0; i < 256; i++) {
      dict.set(i, String.fromCharCode(i));
    }

    const compressed = input.split('').map(c => c.charCodeAt(0));
    let w = String.fromCharCode(compressed[0]);
    let result = w;
    let dictSize = 256;

    for (let i = 1; i < compressed.length; i++) {
      const k = compressed[i];
      let entry: string;
      if (dict.has(k)) {
        entry = dict.get(k)!;
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
  // ESTIMATE
  // ============================================
  estimate(data: any): {
    original: number;
    estimated: number;
    ratio: string;
  } {
    const jsonString = JSON.stringify(data);
    const estimated = Math.round(jsonString.length * 0.3);
    return {
      original: jsonString.length,
      estimated,
      ratio: ((1 - estimated / jsonString.length) * 100).toFixed(1) + '%',
    };
  }
}
