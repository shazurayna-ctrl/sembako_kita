// web-pwa/js/operational/checklist/self-practice.js
// Tantangan mandiri — praktek harian untuk warga

export class SelfPractice {
  constructor() {
    this.challenges = [
      {
        id: 1,
        title: 'Catat Semua Pengeluaran Dapur Hari Ini',
        description: 'Tulis semua pengeluaran untuk kebutuhan dapur. Berapa totalnya?',
        category: 'Keuangan',
        difficulty: 'Mudah',
        estimatedTime: '5 menit'
      },
      {
        id: 2,
        title: 'Cek Stok Beras di Rumah',
        description: 'Hitung sisa beras di rumah. Cukup untuk berapa hari lagi?',
        category: 'Pangan',
        difficulty: 'Mudah',
        estimatedTime: '3 menit'
      },
      {
        id: 3,
        title: 'Praktek Filter Air Sederhana',
        description: 'Buat filter air dari arang, kerikil, dan pasir. Foto hasilnya!',
        category: 'Kebersihan',
        difficulty: 'Sedang',
        estimatedTime: '15 menit'
      },
      {
        id: 4,
        title: 'Hitung Total Hutang dan Piutang',
        description: 'Catat semua hutang dan piutang Anda. Berapa selisihnya?',
        category: 'Keuangan',
        difficulty: 'Sedang',
        estimatedTime: '10 menit'
      }
    ];
    this.completed = [];
    this.loadFromStorage();
  }

  loadFromStorage() {
    try {
      const saved = localStorage.getItem('selfPracticeCompleted');
      if (saved) {
        this.completed = JSON.parse(saved);
      }
    } catch (e) {
      console.error('[PRACTICE] Load error:', e);
    }
  }

  saveToStorage() {
    try {
      localStorage.setItem('selfPracticeCompleted', JSON.stringify(this.completed));
    } catch (e) {
      console.error('[PRACTICE] Save error:', e);
    }
  }

  getTodayChallenge() {
    const today = new Date().toISOString().split('T')[0];
    const index = new Date().getDate() % this.challenges.length;
    const challenge = { ...this.challenges[index] };
    challenge.date = today;
    challenge.isCompleted = this.isCompleted(challenge.id);
    return challenge;
  }

  getAllChallenges() {
    return this.challenges.map(c => ({
      ...c,
      isCompleted: this.isCompleted(c.id)
    }));
  }

  markComplete(id) {
    if (!this.isCompleted(id)) {
      this.completed.push({
        id: id,
        completedAt: new Date().toISOString()
      });
      this.saveToStorage();
      return true;
    }
    return false;
  }

  isCompleted(id) {
    return this.completed.some(c => c.id === id);
  }

  getStats() {
    return {
      total: this.challenges.length,
      completed: this.completed.length,
      percentage: Math.round((this.completed.length / this.challenges.length) * 100),
      today: this.getTodayChallenge()
    };
  }

  reset() {
    this.completed = [];
    this.saveToStorage();
  }
}
