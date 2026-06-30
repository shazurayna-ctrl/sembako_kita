// web-pwa/js/modules/ai/ai-assistant.js
// AI Assistant + Stress Barometer

export class AIAssistant {
  constructor() {
    this.keywords = {
      stok: 12,
      harga: 8,
      bantuan: 5,
      langka: 3,
      panik: 2
    };
    this.rekomendasi = 'Berdasarkan analisis 24 jam terakhir, tingkat stres komunitas masih dalam batas normal. Tetap pantau kata kunci "langka" yang meningkat 40% dari kemarin.';
    this.chatHistory = [];
  }

  analyze(text) {
    const lower = text.toLowerCase();
    let found = false;
    for (const [word, count] of Object.entries(this.keywords)) {
      if (lower.includes(word)) {
        this.keywords[word] += 1;
        found = true;
      }
    }
    return found;
  }

  getStressLevel() {
    const total = Object.values(this.keywords).reduce((a, b) => a + b, 0);
    const panicLevel = (this.keywords.panik / total) * 100;
    return {
      level: panicLevel < 5 ? 'Tenang' : 'Waspada',
      percentage: Math.min(panicLevel, 100),
      status: panicLevel < 5 ? '🟢 Normal' : '🟡 Perlu Perhatian'
    };
  }

  getRecommendation() {
    return this.rekomendasi;
  }

  chat(message) {
    this.chatHistory.push({ role: 'user', message, time: new Date().toISOString() });
    this.analyze(message);

    let response = '';
    const lower = message.toLowerCase();
    if (lower.includes('stok')) {
      response = 'Stok beras: 446kg, Minyak: 277L, Telur: 117kg, Gula: 198kg. Semua aman.';
    } else if (lower.includes('harga')) {
      response = 'Harga HET: Beras Rp12.500, Minyak Rp15.700, Telur Rp27.500, Gula Rp14.500.';
    } else if (lower.includes('bantuan')) {
      response = 'Ada 4 node mesh aktif dalam radius 2.4km. Bantuan terdekat: Pak Budi (200m).';
    } else if (lower.includes('laporan')) {
      response = 'Ada 4 laporan masuk: 2 darurat, 2 normal. Yang terbaru: kelangkaan beras RW 07.';
    } else {
      response = 'Saya siap membantu. Coba tanyakan: stok, harga, bantuan, atau laporan. 😊';
    }

    this.chatHistory.push({ role: 'assistant', message: response, time: new Date().toISOString() });
    return response;
  }

  getChatHistory() {
    return this.chatHistory.slice(-10);
  }

  reset() {
    this.chatHistory = [];
  }
}
