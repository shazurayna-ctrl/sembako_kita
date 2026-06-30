// web-pwa/js/agent/local-brain.js
// Otak utama AI Agentic: ngerti konteks, ambil keputusan, eksekusi

import { DeviceHealth } from '../adapters/device-health.js';
import { SecurityGuard } from './security-guard.js';
import { VoiceEngine } from './voice-engine.js';
import { ChatResponder } from './chat-responder.js';
import { ActionExecutor } from './action-executor.js';
import { SelfOptimizer } from './self-optimizer.js';

export class LocalBrain {
  constructor(config = {}) {
    this.config = {
      mode: 'auto', // auto | normal | krisis | survival
      securityLevel: 'maximum',
      voiceEnabled: true,
      ...config
    };

    // Init semua komponen
    this.device = new DeviceHealth();
    this.security = new SecurityGuard();
    this.voice = new VoiceEngine();
    this.chat = new ChatResponder();
    this.executor = new ActionExecutor();
    this.optimizer = new SelfOptimizer();

    this.context = {
      mode: 'normal',
      lastAction: null,
      userIntent: null,
      conversationHistory: [],
      threats: []
    };

    this.init();
  }

  async init() {
    // Deteksi kondisi HP
    const deviceInfo = await this.device.detect();
    this.context.mode = this.device.getMode();
    
    // Cek keamanan
    const threats = await this.security.scanAllFiles();
    if (threats.length > 0) {
      this.context.mode = 'survival';
      this.context.threats = threats;
      console.warn('[BRAIN] Threat detected! Mode -> Survival');
    }

    // Optimasi otomatis
    this.optimizer.optimize(this.context.mode);

    // Inisialisasi voice kalo diizinkan
    if (this.config.voiceEnabled && this.context.mode !== 'survival') {
      await this.voice.init();
    }

    console.log('[BRAIN] Initialized with mode:', this.context.mode);
    return this.context;
  }

  // 🔥 Proses input dari user (teks atau suara)
  async process(input, type = 'text') {
    let text = input;

    // Kalo input suara, ubah ke teks dulu
    if (type === 'voice') {
      text = await this.voice.transcribe(input);
      if (!text) {
        return 'Maaf, saya tidak mendengar dengan jelas. Bisa ulangi, Bu/Pak? 🎙️';
      }
    }

    // Simpan ke history
    this.context.conversationHistory.push({
      role: 'user',
      content: text,
      timestamp: new Date().toISOString()
    });

    // Analisis intent
    const intent = this.chat.detectIntent(text);
    this.context.userIntent = intent;

    let response = '';

    // Eksekusi berdasarkan intent
    switch(intent.type) {
      case 'report':
        response = await this.executor.handleReport(text, this.context);
        break;
      case 'stok':
        response = await this.executor.handleStok(text, this.context);
        break;
      case 'bantuan':
        response = await this.executor.handleBantuan(text, this.context);
        break;
      case 'sos':
        response = await this.executor.handleSOS(this.context);
        break;
      case 'checklist':
        response = await this.executor.handleChecklist(text, this.context);
        break;
      case 'barter':
        response = await this.executor.handleBarter(text, this.context);
        break;
      case 'kondisi':
        response = this.getStatus();
        break;
      default:
        response = this.chat.generateResponse(text, this.context);
    }

    // Simpan response ke history
    this.context.conversationHistory.push({
      role: 'assistant',
      content: response,
      timestamp: new Date().toISOString()
    });

    this.context.lastAction = response;
    return response;
  }

  // 🩺 Cek status sistem
  getStatus() {
    const deviceInfo = this.device.info;
    return `
📊 **Status Posko SembakoKita**

🖥️ Mode: ${this.context.mode.toUpperCase()}
📱 RAM: ${deviceInfo.ram} GB | Baterai: ${deviceInfo.battery}%
📶 Sinyal: ${navigator.onLine ? 'Online' : 'Offline (Mesh aktif)'}
🔒 Keamanan: ${this.security.isSafe() ? '✅ Aman' : '⚠️ Ada threat!'}
🗣️ Voice: ${this.voice.isReady ? '✅ Siap' : '❌ Tidak tersedia'}

Ada yang bisa saya bantu, Bu/Pak?
    `.trim();
  }

  // 🔄 Ganti mode manual
  setMode(mode) {
    if (['normal', 'krisis', 'survival'].includes(mode)) {
      this.context.mode = mode;
      this.optimizer.optimize(mode);
      console.log('[BRAIN] Mode changed to:', mode);
      return true;
    }
    return false;
  }

  // 📝 Dapatkan rekomendasi dari device
  getRecommendation() {
    return this.device.getRecommendation();
  }

  // 🔒 Cek keamanan
  isSecure() {
    return this.security.isSafe();
  }

  // 🗑️ Reset konteks
  reset() {
    this.context.conversationHistory = [];
    this.context.lastAction = null;
    this.context.userIntent = null;
    return 'Baik, saya reset percakapan. Mulai dari awal lagi, Bu/Pak. 😊';
  }
}
