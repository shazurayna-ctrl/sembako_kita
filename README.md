# 🌾 SembakoKita.Pro

**Ekosistem Krisis Pangan — Offline-first, Mesh Network, AI Agentic**

> Dibangun untuk rakyat, oleh rakyat. Bantu warung kecil, lindungi ketahanan pangan.

---

## 📌 Tentang Proyek

SembakoKita.Pro adalah aplikasi hybrid (PWA + Tauri) yang dirancang untuk membantu **pedagang kecil, warung sembako, dan komunitas** dalam menghadapi krisis pangan.

**Fitur Utama:**
- ✅ **Kasir Retail** — Mesin kasir dengan margin 15% otomatis ke dana subsidi
- ✅ **Stok Gudang** — Manajemen stok real-time dengan notifikasi menipis
- ✅ **Barter & Pasar** — Tukar komoditas tanpa uang, dengan Trust Score komunitas
- ✅ **Mesh Network** — Jaringan offline via Bluetooth BLE, gossip protocol
- ✅ **Ledger Chain** — Blockchain lokal anti-edit untuk transparansi
- ✅ **AI Assistant** — Chatbot + Stress Barometer deteksi panik warga
- ✅ **Offline-first** — Semua fitur jalan tanpa internet, sync otomatis saat online
- ✅ **Mode Hemat** — Adaptif ke HP jadul (RAM 1GB, baterai irit)

---

## 🏗️ Arsitektur
sembakokita-pro/
├── .github/workflows/ # CI/CD auto-build
├── .ai/agent-brain/ # AI Agentic builder (self-building repo)
├── infrastructure/ # Docker + Supabase hybrid
├── src-tauri/ # Tauri (Rust) — APK/EXE wrapper
├── web-pwa/ # PWA utama
│ ├── css/ # Style (Normal, Krisis, Survival)
│ ├── js/
│ │ ├── core/ # App, Supabase, State, UI
│ │ ├── agent/ # AI Agentic lokal (9 file)
│ │ ├── adapters/ # Device Health, Module Manager, dll
│ │ ├── synchronization/ # Sync engine, background sync
│ │ ├── utils/ # Encryption, Compression, Logger
│ │ ├── modules/ # Inventory, Barter, Mesh, AI, Ledger, Defense
│ │ └── operational/ # Checklist, Reports, Funding, Logistics
│ └── assets/ # Icons, screenshots, fonts
├── backend-hub/ # NestJS AI Engine (Qwen 3.7)
├── tests/ # Unit & integration tests
└── docs/ # Dokumentasi
