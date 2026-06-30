// web-pwa/js/agent/voice-engine.js
// Voice engine offline pake Web Speech API + fallback Whisper

export class VoiceEngine {
  constructor() {
    this.isReady = false;
    this.recognition = null;
    this.synthesis = window.speechSynthesis;
    this.supported = false;
    this.init();
  }

  init() {
    // Cek dukungan Web Speech API
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();
      this.recognition.lang = 'id-ID'; // Bahasa Indonesia
      this.recognition.continuous = false;
      this.recognition.interimResults = true;
      this.recognition.maxAlternatives = 3;
      this.supported = true;
      this.isReady = true;
      console.log('[VOICE] Web Speech API siap');
    } else {
      console.warn('[VOICE] Web Speech API tidak didukung. Fallback ke text input.');
      this.isReady = false;
    }
  }

  // 🎙️ Mulai mendengarkan suara user
  async listen() {
    return new Promise((resolve, reject) => {
      if (!this.isReady || !this.recognition) {
        reject('Voice tidak tersedia');
        return;
      }

      let finalTranscript = '';
      let interimTranscript = '';

      this.recognition.onresult = (event) => {
        interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }
        // Kirim progres interim (opsional)
        if (interimTranscript) {
          console.log('[VOICE] Interim:', interimTranscript);
        }
      };

      this.recognition.onerror = (event) => {
        console.error('[VOICE] Error:', event.error);
        reject(event.error);
      };

      this.recognition.onend = () => {
        if (finalTranscript) {
          resolve(finalTranscript.trim());
        } else {
          reject('Tidak ada suara terdeteksi');
        }
      };

      // Mulai listen
      this.recognition.start();
    });
  }

  // 🔄 Ubah suara ke teks (wrapper)
  async transcribe(audioBlob = null) {
    // Kalo pake Web Speech API, panggil listen()
    if (this.isReady) {
      try {
        return await this.listen();
      } catch (error) {
        console.error('[VOICE] Transcribe error:', error);
        return null;
      }
    }

    // Fallback: kalo ada audioBlob, kirim ke server (opsional)
    if (audioBlob) {
      // TODO: Kirim ke backend Whisper
      console.warn('[VOICE] Fallback ke server whisper');
      return null;
    }

    return null;
  }

  // 🔊 Text-to-Speech (bicara ke user)
  speak(text, lang = 'id-ID') {
    if (!this.synthesis) return;

    // Hentikan suara sebelumnya
    this.synthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;

    // Cari suara perempuan Indonesia kalo ada
    const voices = this.synthesis.getVoices();
    const indoVoice = voices.find(v => v.lang.includes('id'));
    if (indoVoice) {
      utterance.voice = indoVoice;
    }

    this.synthesis.speak(utterance);
    return utterance;
  }

  // Hentikan bicara
  stopSpeaking() {
    if (this.synthesis) {
      this.synthesis.cancel();
    }
  }

  // Cek apakah voice ready
  isVoiceReady() {
    return this.isReady;
  }

  // Dapatkan daftar suara yang tersedia
  getVoices() {
    return this.synthesis ? this.synthesis.getVoices() : [];
  }
}
