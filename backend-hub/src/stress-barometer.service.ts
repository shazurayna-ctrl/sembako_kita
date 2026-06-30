// ============================================
// STRESS-BAROMETER.SERVICE.TS
// ============================================
// Tugas:
// 1. Analisis kata-kata dari laporan warga
// 2. Deteksi tingkat stres masyarakat
// 3. Rekomendasi tindakan preventif
// ============================================

import { Injectable, Logger } from '@nestjs/common';

export interface StressAnalysis {
  level: 'tenang' | 'waspada' | 'stres' | 'panik';
  percentage: number;
  keywords: Record<string, number>;
  recommendation: string;
  timestamp: string;
}

@Injectable()
export class StressBarometerService {
  private readonly logger = new Logger(StressBarometerService.name);
  private keywordHistory: Record<string, number[]> = {};
  private readonly keywords = {
    panik: ['panik', 'takut', 'cemas', 'khawatir', 'was-was'],
    stres: ['stres', 'tegang', 'lelah', 'capek', 'pusing'],
    waspada: ['waspada', 'siaga', 'perhatian', 'langka'],
    tenang: ['tenang', 'aman', 'cukup', 'baik', 'normal'],
  };

  // ============================================
  // ANALISIS UTAMA
  // ============================================
  analyze(text: string): StressAnalysis {
    const words = text.toLowerCase().split(/\s+/);
    const detected: Record<string, number> = {
      panik: 0,
      stres: 0,
      waspada: 0,
      tenang: 0,
    };

    for (const word of words) {
      for (const [category, list] of Object.entries(this.keywords)) {
        if (list.includes(word)) {
          detected[category] = (detected[category] || 0) + 1;
        }
      }
    }

    // Hitung total & persentase
    const total = Object.values(detected).reduce((a, b) => a + b, 0) || 1;
    const percentages = {
      panik: (detected.panik / total) * 100,
      stres: (detected.stres / total) * 100,
      waspada: (detected.waspada / total) * 100,
      tenang: (detected.tenang / total) * 100,
    };

    // Tentukan level
    let level: StressAnalysis['level'] = 'tenang';
    if (percentages.panik > 30) level = 'panik';
    else if (percentages.stres > 25) level = 'stres';
    else if (percentages.waspada > 20) level = 'waspada';

    // Simpan history
    this.saveHistory(detected);

    // Rekomendasi
    const recommendation = this.getRecommendation(level);

    return {
      level,
      percentage: Math.max(percentages.panik, percentages.stres),
      keywords: detected,
      recommendation,
      timestamp: new Date().toISOString(),
    };
  }

  // ============================================
  // REKOMENDASI
  // ============================================
  private getRecommendation(level: StressAnalysis['level']): string {
    const recommendations: Record<StressAnalysis['level'], string> = {
      tenang: '✅ Masyarakat dalam kondisi tenang. Terus pantau dan jaga komunikasi.',
      waspada: '⚠️ Ada tanda-tanda kekhawatiran. Perkuat komunikasi dan distribusi informasi.',
      stres: '⚠️ Tingkat stres meningkat. Segera lakukan tindakan: distribusi bantuan, komunikasi intensif.',
      panik: '🚨 TINGKAT PANIK TINGGI! Segera koordinasi darurat, tenangkan masyarakat, prioritaskan bantuan.',
    };
    return recommendations[level] || recommendations.tenang;
  }

  // ============================================
  // HISTORY & TREND
  // ============================================
  private saveHistory(detected: Record<string, number>) {
    const now = Date.now();
    const hour = new Date(now).getHours();
    if (!this.keywordHistory[hour]) {
      this.keywordHistory[hour] = [];
    }
    this.keywordHistory[hour].push(Object.values(detected).reduce((a, b) => a + b, 0));
  }

  getTrend(): { hour: number; stress: number }[] {
    const trend = [];
    for (const [hour, values] of Object.entries(this.keywordHistory)) {
      const avg = values.reduce((a, b) => a + b, 0) / values.length;
      trend.push({ hour: parseInt(hour), stress: avg });
    }
    return trend.sort((a, b) => a.hour - b.hour);
  }

  // ============================================
  // ANALISIS MASALAH
  // ============================================
  getTopIssues(texts: string[]): { issue: string; count: number }[] {
    const issues: Record<string, number> = {};
    const keywords = ['beras', 'minyak', 'gula', 'air', 'listrik', 'obat', 'logistik'];
    
    for (const text of texts) {
      const lower = text.toLowerCase();
      for (const keyword of keywords) {
        if (lower.includes(keyword)) {
          issues[keyword] = (issues[keyword] || 0) + 1;
        }
      }
    }

    return Object.entries(issues)
      .map(([issue, count]) => ({ issue, count }))
      .sort((a, b) => b.count - a.count);
  }
}
