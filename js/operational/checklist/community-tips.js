// web-pwa/js/operational/checklist/community-tips.js
// Saran dan tips dari warga lain

export class CommunityTips {
  constructor() {
    this.tips = [
      {
        id: 1,
        title: 'Cara Hemat Gas Elpiji',
        content: 'Gunakan panci presto untuk memasak. Bisa hemat gas sampai 50%!',
        author: 'Ibu Sari',
        likes: 12,
        createdAt: '2026-06-28'
      },
      {
        id: 2,
        title: 'Tanaman Obat Keluarga',
        content: 'Tanam jahe, kunyit, dan sereh di pot. Bisa dipakai buat obat tradisional.',
        author: 'Pak Budi',
        likes: 8,
        createdAt: '2026-06-29'
      },
      {
        id: 3,
        title: 'Cara Awetkan Ikan Tanpa Kulkas',
        content: 'Garam dan jemur di bawah sinar matahari. Ikan bisa tahan 2 minggu.',
        author: 'Bu Min',
        likes: 15,
        createdAt: '2026-06-30'
      }
    ];
    this.loadFromStorage();
  }

  loadFromStorage() {
    try {
      const saved = localStorage.getItem('communityTips');
      if (saved) {
        this.tips = JSON.parse(saved);
      }
    } catch (e) {
      console.error('[TIPS] Load error:', e);
    }
  }

  saveToStorage() {
    try {
      localStorage.setItem('communityTips', JSON.stringify(this.tips));
    } catch (e) {
      console.error('[TIPS] Save error:', e);
    }
  }

  getAllTips() {
    return this.tips.sort((a, b) => b.likes - a.likes);
  }

  getTopTips(limit = 3) {
    return this.getAllTips().slice(0, limit);
  }

  addTip(tip) {
    tip.id = Date.now();
    tip.likes = 0;
    tip.createdAt = new Date().toISOString().split('T')[0];
    this.tips.unshift(tip);
    this.saveToStorage();
    return tip;
  }

  likeTip(id) {
    const tip = this.tips.find(t => t.id === id);
    if (tip) {
      tip.likes += 1;
      this.saveToStorage();
      return tip.likes;
    }
    return 0;
  }

  getStats() {
    return {
      total: this.tips.length,
      totalLikes: this.tips.reduce((sum, t) => sum + t.likes, 0),
      topTip: this.getTopTips(1)[0]
    };
  }
}
