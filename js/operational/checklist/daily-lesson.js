// web-pwa/js/operational/checklist/daily-lesson.js
// Ilmu hari ini — edukasi mandiri untuk warga

export class DailyLesson {
  constructor() {
    this.lessons = [
      {
        id: 1,
        title: 'Cara Menyimpan Beras Agar Tahan 6 Bulan',
        content: 'Simpan beras dalam wadah kedap udara, tambahkan daun salam atau bawang putih untuk mencegah kutu. Letakkan di tempat sejuk dan kering.',
        category: 'Pangan',
        source: 'Penyuluhan Pangan',
        date: '2026-06-30'
      },
      {
        id: 2,
        title: 'Cara Filter Air Sederhana Pakai Arang + Kerikil',
        content: 'Buat filter dari ember: lapisan kerikil, pasir, arang, dan ijuk. Air kotor jadi bersih dalam 30 menit.',
        category: 'Kebersihan',
        source: 'BPBD',
        date: '2026-07-01'
      },
      {
        id: 3,
        title: 'Cara Bikin Kompos dari Sisa Sayur',
        content: 'Campur sisa sayur, daun kering, dan tanah. Tutup rapat, aduk setiap 3 hari. Kompos siap dalam 2 minggu.',
        category: 'Lingkungan',
        source: 'Kementerian Lingkungan',
        date: '2026-07-02'
      },
      {
        id: 4,
        title: 'Pertolongan Pertama pada Luka Bakar',
        content: 'Aliri air mengalir selama 10-15 menit. Jangan olesi pasta gigi atau minyak. Tutup dengan kain bersih.',
        category: 'Kesehatan',
        source: 'PMI',
        date: '2026-07-03'
      }
    ];
    this.currentIndex = 0;
    this.loadFromStorage();
  }

  loadFromStorage() {
    try {
      const saved = localStorage.getItem('dailyLessonIndex');
      if (saved) {
        this.currentIndex = parseInt(saved) % this.lessons.length;
      }
    } catch (e) {
      console.error('[LESSON] Load error:', e);
    }
  }

  saveToStorage() {
    try {
      localStorage.setItem('dailyLessonIndex', String(this.currentIndex));
    } catch (e) {
      console.error('[LESSON] Save error:', e);
    }
  }

  getTodayLesson() {
    const today = new Date().toISOString().split('T')[0];
    const lesson = this.lessons[this.currentIndex];
    // Update date jika beda
    if (lesson.date !== today) {
      this.currentIndex = (this.currentIndex + 1) % this.lessons.length;
      this.lessons[this.currentIndex].date = today;
      this.saveToStorage();
    }
    return this.lessons[this.currentIndex];
  }

  getLessonByIndex(index) {
    return this.lessons[index % this.lessons.length] || null;
  }

  getAllLessons() {
    return this.lessons;
  }

  addLesson(lesson) {
    lesson.id = Date.now();
    lesson.date = new Date().toISOString().split('T')[0];
    this.lessons.push(lesson);
    this.saveToStorage();
    return lesson;
  }

  getCategories() {
    return [...new Set(this.lessons.map(l => l.category))];
  }

  getByCategory(category) {
    return this.lessons.filter(l => l.category === category);
  }

  getStats() {
    return {
      total: this.lessons.length,
      categories: this.getCategories().length,
      today: this.getTodayLesson()
    };
  }
}
