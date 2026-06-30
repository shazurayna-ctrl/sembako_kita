// web-pwa/js/agent/chat-responder.js
// Chat responder dengan rule-based + template

export class ChatResponder {
  constructor() {
    this.intents = {
      report: ['laporan', 'laporkan', 'lapor', 'ada masalah', 'kejadian'],
      stok: ['stok', 'beras', 'minyak', 'gula', 'telur', 'sembako', 'persediaan'],
      bantuan: ['bantuan', 'tolong', 'bantu', 'butuh', 'minta', 'kurang'],
      sos: ['sos', 'darurat', 'emergency', 'bahaya', 'krisis', 'tolong cepat'],
      checklist: ['checklist', 'tugas', 'target', 'besok', 'hari ini', 'eksekusi'],
      barter: ['barter', 'tukar', 'ganti', 'rasio', 'nilai'],
      kondisi: ['kondisi', 'status', 'info', 'update', 'bagaimana', 'ada apa']
    };
  }

  // 🔍 Deteksi intent dari text user
  detectIntent(text) {
    const lower = text.toLowerCase();
    let maxScore = 0;
    let detectedType = 'general';

    for (const [type, keywords] of Object.entries(this.intents)) {
      let score = 0;
      for (const keyword of keywords) {
        if (lower.includes(keyword)) {
          score += 1;
        }
      }
      if (score > maxScore) {
        maxScore = score;
        detectedType = type;
      }
    }

    return {
      type: detectedType,
      score: maxScore,
      confidence: maxScore / 3 // max 3 kata kunci
    };
  }

  // 💬 Generate response berdasarkan intent
  generateResponse(text, context) {
    const intent = this.detectIntent(text);
    const mode = context.mode || 'normal';

    // Response berdasarkan mode
    const modePrefix = {
      normal: '',
      krisis: '⚠️ Dalam situasi krisis, ',
      survival: '🆘 Mode survival aktif. '
    };

    const prefix = modePrefix[mode] || '';

    // Response berdasarkan intent
    const responses = {
      report: [
        `${prefix}Baik, saya catat laporan Bapak/Ibu. Semoga cepat selesai. 🙏`,
        `${prefix}Laporan diterima. Kami akan segera tindak lanjuti.`,
        `${prefix}Terima kasih sudah melapor. Ini penting buat kita semua.`
      ],
      stok: [
        `📦 Stok sembako: Beras 446kg, Minyak 277L, Telur 117kg, Gula 198kg. Masih aman.`,
        `📊 Stok terkini: Semua komoditas dalam batas normal.`,
        `🛒 Stok masih mencukupi untuk 7 hari ke depan.`
      ],
      bantuan: [
        `${prefix}Saya cari bantuan terdekat. Ada 3 warga dalam radius 500m yang siap bantu.`,
        `${prefix}Baik, saya koordinasikan dengan relawan terdekat. Mohon tunggu sebentar.`,
        `${prefix}Bantuan sedang dalam perjalanan. Tetap tenang, Bu/Pak.`
      ],
      sos: [
        `🚨 **SINYAL DARURAT** terkirim ke semua node dalam radius 2.4km. Tim akan segera datang!`,
        `🆘 SOS diterima. Semua relawan dalam radius 1km sudah diberi tahu.`,
        `⚠️ DARURAT! Bantuan sedang diarahkan ke lokasi Anda. Tetap di tempat.`
      ],
      checklist: [
        `📋 Checklist hari ini: \n✅ Distribusi beras RW 07\n✅ Perbaikan pipa RT 03\n✅ Pengambilan stok di Pasar Cibitung`,
        `📌 Target besok: \n1. Distribusi 50kg beras\n2. Perbaikan pipa\n3. Backup database`,
        `📝 Eksekusi hari ini: \n- Pengambilan stok (Truk B-1234-XY)\n- Verifikasi data 15 KK\n- Backup database`
      ],
      barter: [
        `🔄 Rasio barter saat ini: 1kg Beras = 1.82kg Telur (berdasarkan HET Juni 2026)`,
        `📊 Trust Score komunitas: 87 (Tinggi). Dari 142 transaksi sukses.`,
        `💱 Ingin barter? Saya bisa bantu hitung rasio komoditas.`
      ],
      kondisi: [
        this.getStatusResponse(context)
      ],
      general: [
        `Baik, Bu/Pak. Saya dengar. Ada yang bisa saya bantu lagi? 😊`,
        `Terima kasih sudah menggunakan SembakoKita.Pro. Semoga sehat selalu.`,
        `Siap, Bu/Pak. Saya catat. Apakah ada lagi yang perlu dibantu?`,
        `Mohon maaf, saya belum paham maksudnya. Bisa diulang, Bu/Pak?`,
        `Ya, Bu/Pak? Saya siap membantu.`,
        `Ada yang bisa saya bantu untuk warung atau posko hari ini?`
      ]
    };

    const responseList = responses[intent.type] || responses.general;
    return responseList[Math.floor(Math.random() * responseList.length)];
  }

  getStatusResponse(context) {
    const deviceInfo = context.deviceInfo || { ram: 2, battery: 75 };
    return `
📊 **Status SembakoKita.Pro**
🖥️ Mode: ${context.mode.toUpperCase()}
📱 RAM: ${deviceInfo.ram} GB | Baterai: ${deviceInfo.battery}%
🔒 Keamanan: ${context.threats?.length === 0 ? '✅ Aman' : '⚠️ Ada threat!'}
📶 Sinyal: ${navigator.onLine ? 'Online' : 'Offline (Mesh aktif)'}

Semua sistem berjalan normal. Ada yang bisa saya bantu?
    `.trim();
  }
}
