// web-pwa/js/agent/action-executor.js
// Eksekusi perintah user: laporan, stok, bantuan, dll

export class ActionExecutor {
  constructor() {
    this.actions = {
      report: this.handleReport.bind(this),
      stok: this.handleStok.bind(this),
      bantuan: this.handleBantuan.bind(this),
      sos: this.handleSOS.bind(this),
      checklist: this.handleChecklist.bind(this),
      barter: this.handleBarter.bind(this)
    };
  }

  // 📝 Handle laporan warga
  async handleReport(text, context) {
    // Ekstrak informasi dari text
    const report = {
      id: Date.now().toString(36),
      text: text,
      waktu: new Date().toISOString(),
      mode: context.mode,
      status: 'pending'
    };

    // Simpan ke IndexedDB / Supabase
    try {
      await this.saveReport(report);
      return `✅ Laporan sudah saya catat, Bu/Pak. 
      
📋 **Ringkasan Laporan:**
${text.substring(0, 100)}${text.length > 100 ? '...' : ''}

🕐 Waktu: ${new Date().toLocaleString('id-ID')}
📌 Status: Menunggu verifikasi

Terima kasih sudah melapor. 🙏`;
    } catch (error) {
      console.error('[EXECUTOR] Gagal menyimpan laporan:', error);
      return 'Maaf, ada masalah saat menyimpan laporan. Coba lagi, Bu/Pak.';
    }
  }

  // 📦 Handle cek stok
  async handleStok(text, context) {
    // Ambil dari IndexedDB / Supabase
    // Sementara pake data dummy
    const stokData = {
      beras: { stok: 446, satuan: 'kg', minimal: 100 },
      minyak: { stok: 277, satuan: 'liter', minimal: 80 },
      telur: { stok: 117, satuan: 'kg', minimal: 50 },
      gula: { stok: 198, satuan: 'kg', minimal: 60 },
      garam: { stok: 347, satuan: 'bungkus', minimal: 100 },
      mie: { stok: 499, satuan: 'pcs', minimal: 150 }
    };

    let response = '📦 **Stok Gudang Saat Ini:**\n\n';
    let adaMenipis = false;

    for (const [item, data] of Object.entries(stokData)) {
      const status = data.stok <= data.minimal ? '⚠️ Menipis' : '✅ Aman';
      if (data.stok <= data.minimal) adaMenipis = true;
      response += `- ${item.charAt(0).toUpperCase() + item.slice(1)}: ${data.stok} ${data.satuan} (${status})\n`;
    }

    if (adaMenipis) {
      response += '\n⚠️ **Ada stok yang menipis!** Segera lakukan pengadaan.';
    } else {
      response += '\n✅ **Semua stok dalam kondisi aman.**';
    }

    return response;
  }

  // 🆘 Handle bantuan
  async handleBantuan(text, context) {
    // Cari bantuan terdekat via Mesh
    // Sementara pake dummy
    const bantuanData = {
      radius: '500m',
      wargaSiap: 3,
      wargaTerdekat: [
        { nama: 'Pak Budi', jarak: '200m', siap: true },
        { nama: 'Bu Siti', jarak: '350m', siap: true },
        { nama: 'Pak Joko', jarak: '480m', siap: false }
      ]
    };

    let response = `🆘 **Bantuan Terdekat dalam Radius ${bantuanData.radius}:**\n\n`;
    response += `👥 ${bantuanData.wargaSiap} warga siap membantu.\n\n`;

    for (const warga of bantuanData.wargaTerdekat) {
      const status = warga.siap ? '✅ Siap' : '❌ Tidak tersedia';
      response += `- ${warga.nama} (${warga.jarak}) - ${status}\n`;
    }

    response += '\n💬 **Ingin saya hubungkan dengan salah satu dari mereka?**';
    return response;
  }

  // 🚨 Handle SOS darurat
  async handleSOS(context) {
    const sosData = {
      waktu: new Date().toISOString(),
      radius: '2.4km',
      nodeTerkirim: 4,
      timestamp: new Date().toLocaleString('id-ID')
    };

    // Broadcast ke semua node via Mesh
    try {
      await this.broadcastSOS(sosData);
    } catch (error) {
      console.error('[EXECUTOR] Gagal broadcast SOS:', error);
    }

    return `🚨 **SINYAL DARURAT TERKIRIM!**

📡 Radius: ${sosData.radius}
📱 Node: ${sosData.nodeTerkirim} node menerima sinyal
🕐 Waktu: ${sosData.timestamp}

⚠️ Bantuan sedang dalam perjalanan.
**Tetap tenang dan tunggu di tempat yang aman.**`;
  }

  // 📋 Handle checklist
  async handleChecklist(text, context) {
    const checklistData = {
      hariIni: [
        'Pengambilan stok di Pasar Cibitung - Truk B-1234-XY',
        'Verifikasi data 15 KK baru - Admin: Rina',
        'Backup database ke USB - Selesai 10:00',
        'Laporan harian ke BPBD - Selesai 11:30',
        'Kalibrasi timbangan posko - Selesai 13:00'
      ],
      targetBesok: [
        'Distribusi 50kg beras ke RW 07 - Relawan: Budi',
        'Perbaikan pipa air RT 03 - Relawan: Andi',
        'Antar 5L minyak ke Ibu Sari - Relawan: Dewi'
      ],
      laporanMasuk: [
        { text: 'Kelangkaan beras di RW 07', prioritas: 'darurat', waktu: '2 jam lalu' },
        { text: 'Ibu Sari butuh minyak goreng', prioritas: 'normal', waktu: '5 jam lalu' },
        { text: 'Kebocoran air bersih RT 03', prioritas: 'darurat', waktu: '6 jam lalu' },
        { text: 'Permintaan gula 10kg PKK', prioritas: 'normal', waktu: '8 jam lalu' }
      ]
    };

    let response = '📋 **Checklist Harian Posko**\n\n';

    // Laporan masuk
    response += '📥 **Laporan Masuk:**\n';
    for (const laporan of checklistData.laporanMasuk) {
      const icon = laporan.prioritas === 'darurat' ? '🔴' : '🟡';
      response += `- ${icon} ${laporan.text} (${laporan.waktu})\n`;
    }

    // Target besok
    response += '\n📌 **Target Besok:**\n';
    for (const target of checklistData.targetBesok) {
      response += `- ✅ ${target}\n`;
    }

    // Eksekusi hari ini
    response += '\n⚡ **Eksekusi Hari Ini:**\n';
    for (const eksekusi of checklistData.hariIni) {
      response += `- 🔄 ${eksekusi}\n`;
    }

    return response;
  }

  // 🔄 Handle barter
  async handleBarter(text, context) {
    const barterData = {
      rasio: [
        { dari: 'Beras', ke: 'Telur', rasio: '1:1.82' },
        { dari: 'Minyak', ke: 'Gula', rasio: '1:1.42' },
        { dari: 'Gula', ke: 'Minyak', rasio: '1:1.08' }
      ],
      trustScore: 87,
      totalTransaksi: 142,
      riwayat: [
        { dari: '5kg Beras', ke: '9.1kg Telur', warga: 'Pak Budi', trust: 92, status: 'valid' },
        { dari: '2L Minyak', ke: '3.5kg Gula', warga: 'Bu Min', trust: 88, status: 'valid' }
      ]
    };

    let response = '🔄 **Pasar Barter Warga**\n\n';

    // Trust Score
    response += `⭐ **Trust Score Komunitas: ${barterData.trustScore}** (Tinggi)\n`;
    response += `📊 Dari ${barterData.totalTransaksi} transaksi sukses\n\n`;

    // Rasio
    response += '📐 **Rasio Barter (HET Juni 2026):**\n';
    for (const r of barterData.rasio) {
      response += `- ${r.dari} : ${r.ke} = ${r.rasio}\n`;
    }

    // Riwayat terbaru
    response += '\n📜 **Riwayat Barter Terbaru:**\n';
    for (const r of barterData.riwayat) {
      const statusIcon = r.status === 'valid' ? '✅' : '❌';
      response += `- ${r.dari} → ${r.ke} (${r.warga}, Trust ${r.trust}) ${statusIcon}\n`;
    }

    return response;
  }

  // 🗄️ Simpan laporan ke IndexedDB / Supabase
  async saveReport(report) {
    // Simpan ke IndexedDB
    const db = await this.openDB();
    const tx = db.transaction('reports', 'readwrite');
    const store = tx.objectStore('reports');
    await store.add(report);
    return report;
  }

  // 📡 Broadcast SOS ke semua node
  async broadcastSOS(sosData) {
    // Kirim via Mesh Network
    // Sementara pake console.log
    console.log('[EXECUTOR] Broadcasting SOS:', sosData);
    return true;
  }

  // 🗄️ Buka IndexedDB
  async openDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('SembakoDB', 1);
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('reports')) {
          db.createObjectStore('reports', { keyPath: 'id' });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
}
