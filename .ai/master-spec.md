# 📜 MASTER SPEC — SembakoKita.Pro
## Jangkar Memori AI — Jangan Biarkan AI Halu!

> **Dokumen ini adalah MANIFESTO proyek. Setiap AI yang membaca ini WAJIB paham visi, misi, dan struktur proyek. Jangan pernah menyimpang dari spesifikasi ini.**

---

## 🎯 VISI

**"Membangun ekosistem krisis pangan yang mandiri, offline-first, dan berdaya guna untuk rakyat kecil."**

SembakoKita.Pro adalah aplikasi hybrid (PWA + Tauri) yang dirancang untuk membantu **pedagang kecil, warung sembako, dan komunitas** dalam menghadapi krisis pangan. Aplikasi ini berjalan **tanpa internet (offline-first)**, menggunakan **mesh network (BLE)** untuk komunikasi antar perangkat, dan dilengkapi dengan **AI Agentic** yang bisa beradaptasi dengan kondisi HP rakyat.

---

## 🧠 MISI

1. **Memberdayakan rakyat kecil** — Pedagang warung, ibu-ibu, dan komunitas bisa mengelola stok, transaksi, dan bantuan tanpa tergantung internet.
2. **Offline-first** — Semua fitur jalan tanpa internet. Sinkronisasi otomatis saat online.
3. **Mesh Network** — Komunikasi antar HP via Bluetooth BLE, tanpa sinyal HP.
4. **AI Agentic Lokal** — AI yang tinggal di HP rakyat, bisa diajak ngobrol, deteksi kondisi HP, dan beradaptasi.
5. **Transparansi** — Ledger chain lokal anti-edit, audit kas terbuka.
6. **Gotong Royong** — Barter, relawan, dan solusi dari tetangga terdekat.

---

---

## 🧩 KOMPONEN UTAMA

### 1. AI Agentic — 2 Sistem dalam 1 Repo

| Lokasi | Fungsi | Teknologi |
|--------|--------|-----------|
| `.ai/agent-brain/` | **Builder AI** — Generate file, scan, push | Node.js |
| `web-pwa/js/agent/` | **AI Lokal HP** — Chat offline, deteksi HP | JavaScript |
| `backend-hub/src/ai/` | **AI Server** — Qwen 3.7, stres, prediksi | NestJS (TS) |

### 2. Fitur Utama APK

| Fitur | File | Keterangan |
|-------|------|------------|
| **Dashboard** | `page-dashboard` | Statistik, grafik, harga HET |
| **Kasir Retail** | `page-cashier` | POS dengan margin 15% ke subsidi |
| **Stok Gudang** | `page-stock` | Manajemen stok real-time |
| **Barter & Pasar** | `page-marketplace` | Tukar komoditas tanpa uang |
| **Checklist Harian** | `page-checklist` | Laporan, target, eksekusi |
| **Laporan Warga** | `page-tickets` | TicketParser otomatis |
| **Pendanaan** | `page-funding` | Multi-sumber dana |
| **Logistik** | `page-logistics` | Distribusi & rute |
| **Mesh Network** | `page-mesh` | BLE gossip protocol |
| **Ledger Chain** | `page-ledger` | Blockchain lokal anti-edit |
| **AI Assistant** | `page-chatbot` | Chat + Stress Barometer |
| **Keamanan** | `page-security` | Zero-trust, enkripsi |
| **Dampak & Viral** | `page-impact` | Proof of Impact |

---

## 🎨 TEMA MODE

| Mode | Warna | Animasi | Fitur Aktif | Cocok Untuk |
|------|-------|---------|-------------|-------------|
| **Normal** | Hijau | Halus | Semua | HP modern (RAM 4GB+) |
| **Krisis** | Merah | Minimal | Core + Mesh | HP menengah (RAM 2GB) |
| **Survival** | Hitam-putih | Mati | Laporan + SOS | HP tua (RAM 1GB) |

---

## 🧠 PANDUAN UNTUK AI AGENTIC

### Aturan Emas:

1. **Rakyat adalah prioritas utama.** Setiap keputusan harus mengutamakan kemudahan rakyat kecil.
2. **Offline-first.** Semua fitur harus jalan tanpa internet.
3. **Hemat daya.** APK harus bisa jalan di HP dengan RAM 1GB dan baterai irit.
4. **Bahasa sederhana.** Gunakan bahasa Indonesia yang mudah dipahami.
5. **Transparan.** Setiap transaksi tercatat di ledger chain.
6. **Anti-manipulasi.** Tidak ada backdoor, tidak ada celah keamanan.

### Larangan:

- ❌ Jangan pernah mengubah struktur proyek tanpa persetujuan.
- ❌ Jangan pernah menambahkan fitur yang membutuhkan internet terus-menerus.
- ❌ Jangan pernah menggunakan library yang berat (size > 500KB).
- ❌ Jangan pernah menyimpan data sensitif tanpa enkripsi.

---

## 📌 CATATAN PENTING

| Item | Keterangan |
|------|------------|
| **Supabase URL** | `https://rltsdrqyvvqkzusocmlr.supabase.co` |
| **Supabase Anon Key** | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| **Version** | `2026.07.01` |
| **Target HP** | Android 5.0+ (API 21+) |
| **Min RAM** | 1 GB |
| **Min Storage** | 50 MB |

---

## 🔥 KOMITMEN

> **"SembakoKita.Pro bukan sekadar aplikasi. Ini adalah gerakan. Gerakan untuk memastikan rakyat kecil tidak pernah kelaparan, tidak pernah kehilangan akses pangan, dan tidak pernah merasa sendirian."**

**Demi rakyat, bro! 🇮🇩**

---

## 📝 CHANGELOG

| Tanggal | Versi | Perubahan |
|---------|-------|-----------|
| 2026-07-01 | 2026.07.01 | Inisialisasi proyek, struktur lengkap, AI Agentic |
| 2026-06-30 | 2026.06.30 | Struktur awal PWA + Tauri |
| 2026-06-28 | 2026.06.28 | Konsep awal, mockup dashboard |

---

**Dokumen ini adalah MILESTONE. Jangan dihapus, jangan diubah, kecuali ada persetujuan dari tim inti.** 🤝

## 🏗️ ARSITEKTUR PROYEK
