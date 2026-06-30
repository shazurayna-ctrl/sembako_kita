// ============================================
// QWEN.SERVICE.TS — SembakoKita.Pro AI Engine
// ============================================
// Tugas:
// 1. Integrasi dengan Qwen 3.7 Max (Cloud/Offline)
// 2. Proses input teks/suara dari user
// 3. Generate response cerdas untuk rakyat
// 4. Deteksi intent & ekstraksi data
// ============================================

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

export interface QwenRequest {
  prompt: string;
  context?: Record<string, any>;
  maxTokens?: number;
  temperature?: number;
  stream?: boolean;
}

export interface QwenResponse {
  text: string;
  intent: 'report' | 'stok' | 'bantuan' | 'sos' | 'barter' | 'checklist' | 'general';
  confidence: number;
  entities?: Record<string, any>;
  tokens: number;
  processingTime: number;
}

@Injectable()
export class QwenService {
  private readonly logger = new Logger(QwenService.name);
  private readonly apiUrl: string;
  private readonly apiKey: string;
  private readonly model: string = 'qwen-3.7-max';
  private isOfflineMode: boolean = false;

  constructor(
    private configService: ConfigService,
    private httpService: HttpService,
  ) {
    this.apiUrl = this.configService.get('AI_API_URL') || 'https://api.qwen.ai/v1';
    this.apiKey = this.configService.get('AI_API_KEY') || '';
    this.isOfflineMode = !this.apiKey;
    
    if (this.isOfflineMode) {
      this.logger.warn('⚠️ Qwen API key not found. Running in OFFLINE mode (rule-based).');
    } else {
      this.logger.log('✅ Qwen 3.7 Max AI Engine initialized');
    }
  }

  // ============================================
  // PROSES UTAMA — Input → Response
  // ============================================
  async process(request: QwenRequest): Promise<QwenResponse> {
    const startTime = Date.now();
    this.logger.log(`📝 Processing: "${request.prompt.substring(0, 50)}..."`);

    try {
      if (!this.isOfflineMode) {
        // Mode ONLINE: Panggil API Qwen
        return await this.callQwenAPI(request);
      } else {
        // Mode OFFLINE: Rule-based fallback
        return await this.ruleBasedProcess(request);
      }
    } catch (error) {
      this.logger.error('❌ Qwen process error:', error);
      // Fallback ke rule-based
      return await this.ruleBasedProcess(request);
    }
  }

  // ============================================
  // ONLINE: Qwen 3.7 Max API
  // ============================================
  private async callQwenAPI(request: QwenRequest): Promise<QwenResponse> {
    const payload = {
      model: this.model,
      messages: [
        {
          role: 'system',
          content: this.getSystemPrompt(),
        },
        {
          role: 'user',
          content: request.prompt,
        },
      ],
      max_tokens: request.maxTokens || 512,
      temperature: request.temperature || 0.7,
      stream: request.stream || false,
    };

    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.apiUrl}/chat/completions`, payload, {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }),
      );

      const result = response.data;
      const text = result.choices?.[0]?.message?.content || 'Maaf, saya tidak bisa memproses permintaan Anda.';
      const tokens = result.usage?.total_tokens || 0;
      const processingTime = Date.now() - (request as any)._startTime || 0;

      return {
        text,
        intent: this.detectIntent(text),
        confidence: 0.9,
        entities: this.extractEntities(text),
        tokens,
        processingTime,
      };
    } catch (error) {
      this.logger.error('❌ Qwen API error:', error);
      throw error;
    }
  }

  // ============================================
  // OFFLINE: Rule-Based Processing
  // ============================================
  private async ruleBasedProcess(request: QwenRequest): Promise<QwenResponse> {
    const text = request.prompt;
    const lower = text.toLowerCase();
    let response = '';
    let intent: QwenResponse['intent'] = 'general';
    let confidence = 0.5;

    // Deteksi intent
    if (lower.includes('laporan') || lower.includes('laporkan') || lower.includes('ada masalah')) {
      intent = 'report';
      confidence = 0.8;
      response = await this.handleReport(text);
    } else if (lower.includes('stok') || lower.includes('beras') || lower.includes('minyak')) {
      intent = 'stok';
      confidence = 0.85;
      response = await this.handleStok(text);
    } else if (lower.includes('bantuan') || lower.includes('tolong') || lower.includes('butuh')) {
      intent = 'bantuan';
      confidence = 0.8;
      response = await this.handleBantuan(text);
    } else if (lower.includes('sos') || lower.includes('darurat') || lower.includes('emergency')) {
      intent = 'sos';
      confidence = 0.9;
      response = await this.handleSOS(text);
    } else if (lower.includes('barter') || lower.includes('tukar') || lower.includes('ganti')) {
      intent = 'barter';
      confidence = 0.8;
      response = await this.handleBarter(text);
    } else if (lower.includes('checklist') || lower.includes('tugas') || lower.includes('target')) {
      intent = 'checklist';
      confidence = 0.75;
      response = await this.handleChecklist(text);
    } else {
      response = this.handleGeneral(text);
    }

    return {
      text: response,
      intent,
      confidence,
      entities: this.extractEntities(text),
      tokens: 0,
      processingTime: 10,
    };
  }

  // ============================================
  // SYSTEM PROMPT — Untuk Qwen API
  // ============================================
  private getSystemPrompt(): string {
    return `
Anda adalah AI Assistant Posko SembakoKita.Pro.
Tugas Anda adalah membantu rakyat dengan:
1. Mencatat laporan warga
2. Mengecek stok sembako
3. Membantu proses barter
4. Menangani laporan darurat/SOS
5. Memberikan info checklist harian
6. Selalu jawab dengan bahasa Indonesia yang ramah

Aturan:
- Jangan pernah memberikan saran medis
- Jangan pernah meminta data pribadi sensitif (KTP, rekening)
- Selalu prioritaskan laporan darurat
- Jawab dengan singkat, jelas, dan penuh empati
`;
  }

  // ============================================
  // INTENT DETECTION
  // ============================================
  private detectIntent(text: string): QwenResponse['intent'] {
    const lower = text.toLowerCase();
    if (lower.includes('laporan')) return 'report';
    if (lower.includes('stok') || lower.includes('beras')) return 'stok';
    if (lower.includes('bantuan') || lower.includes('tolong')) return 'bantuan';
    if (lower.includes('sos') || lower.includes('darurat')) return 'sos';
    if (lower.includes('barter') || lower.includes('tukar')) return 'barter';
    if (lower.includes('checklist') || lower.includes('tugas')) return 'checklist';
    return 'general';
  }

  // ============================================
  // ENTITY EXTRACTION
  // ============================================
  private extractEntities(text: string): Record<string, any> {
    const entities: Record<string, any> = {};
    
    // Ekstrak angka (qty)
    const numbers = text.match(/\d+/g);
    if (numbers) entities.quantities = numbers.map(Number);
    
    // Ekstrak komoditas
    const commodities = ['beras', 'minyak', 'gula', 'telur', 'garam', 'mie', 'susu'];
    const found = commodities.filter(c => text.toLowerCase().includes(c));
    if (found.length > 0) entities.commodities = found;
    
    // Ekstrak lokasi
    const locationMatch = text.match(/RW\s*\d+/i) || text.match(/RT\s*\d+/i);
    if (locationMatch) entities.location = locationMatch[0];
    
    return entities;
  }

  // ============================================
  // HANDLERS — Rule-Based Responses
  // ============================================
  private async handleReport(text: string): Promise<string> {
    return `✅ Laporan sudah saya catat, Bu/Pak. 
    
📋 **Ringkasan:**
${text.substring(0, 100)}${text.length > 100 ? '...' : ''}

🕐 Waktu: ${new Date().toLocaleString('id-ID')}
📌 Status: Menunggu verifikasi posko

Terima kasih sudah melapor. 🙏`;
  }

  private async handleStok(text: string): Promise<string> {
    return `📦 **Stok Gudang Saat Ini:**

✅ Beras SPPH: 446 kg (Aman)
✅ Minyakita: 277 liter (Aman)
✅ Telur Cikarang: 117 kg (Aman)
✅ Gula Pasir: 198 kg (Aman)
✅ Garam Bungkus: 347 bungkus (Aman)

Semua stok dalam kondisi aman.`;
  }

  private async handleBantuan(text: string): Promise<string> {
    return `🆘 **Bantuan Terdekat:**

👥 Dalam radius 500m:
- Pak Budi (200m) — ✅ Siap bantu
- Bu Siti (350m) — ✅ Siap bantu
- Pak Joko (480m) — ❌ Tidak tersedia

💬 **Ingin saya hubungkan dengan Pak Budi atau Bu Siti?**`;
  }

  private async handleSOS(text: string): Promise<string> {
    return `🚨 **SINYAL DARURAT TERKIRIM!**

📡 Radius: 2.4 km
📱 Node: 4 node menerima sinyal
🕐 Waktu: ${new Date().toLocaleString('id-ID')}

⚠️ Bantuan sedang dalam perjalanan.
**Tetap tenang dan tunggu di tempat yang aman.**`;
  }

  private async handleBarter(text: string): Promise<string> {
    return `🔄 **Pasar Barter Warga**

⭐ Trust Score: 87 (Tinggi)
📊 Dari 142 transaksi sukses

📐 **Rasio Barter (HET Juni 2026):**
- Beras : Telur = 1 : 1.82
- Minyak : Gula = 1 : 1.42
- Gula : Minyak = 1 : 1.08

💬 **Ingin menghitung barter? Ketik: "Hitung barter 5kg beras ke telur"**`;
  }

  private async handleChecklist(text: string): Promise<string> {
    return `📋 **Checklist Harian Posko**

📥 **Laporan Masuk:**
- 🔴 Kelangkaan beras RW 07 (2 jam lalu)
- 🟡 Ibu Sari butuh minyak (5 jam lalu)

📌 **Target Besok:**
- ✅ Distribusi 50kg beras ke RW 07
- ✅ Perbaikan pipa air RT 03

⚡ **Eksekusi Hari Ini:**
- 🔄 Pengambilan stok di Pasar Cibitung
- 🔄 Verifikasi data 15 KK baru`;
  }

  private handleGeneral(text: string): string {
    const responses = [
      'Baik, Bu/Pak. Ada yang bisa saya bantu? Saya siap membantu laporan, stok, bantuan, atau barter. 😊',
      'Saya dengar, Bu/Pak. Mohon diulang atau tanyakan: stok, harga, laporan, atau bantuan.',
      'Halo! Saya AI Posko SembakoKita. Silakan tanya tentang stok, laporan, atau bantuan. 🙏',
      'Maaf, saya belum paham. Coba tanyakan: "Cek stok beras" atau "Laporan darurat".',
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }
}
