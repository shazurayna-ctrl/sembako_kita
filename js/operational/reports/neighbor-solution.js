// web-pwa/js/operational/reports/neighbor-solution.js
// Solusi dari tetangga terdekat

export class NeighborSolution {
  constructor() {
    this.solutions = [];
    this.loadFromStorage();
  }

  loadFromStorage() {
    try {
      const saved = localStorage.getItem('neighborSolutions');
      if (saved) {
        this.solutions = JSON.parse(saved);
      }
    } catch (e) {
      console.error('[SOLUTION] Load error:', e);
    }
  }

  saveToStorage() {
    try {
      localStorage.setItem('neighborSolutions', JSON.stringify(this.solutions));
    } catch (e) {
      console.error('[SOLUTION] Save error:', e);
    }
  }

  addSolution(solution) {
    solution.id = Date.now().toString(36);
    solution.waktu = new Date().toISOString();
    solution.status = 'pending';
    this.solutions.unshift(solution);
    this.saveToStorage();
    return solution;
  }

  getSolutionsForReport(reportId) {
    return this.solutions.filter(s => s.reportId === reportId);
  }

  getNearbySolutions(radius = 500) {
    // Simulasi: semua solusi dianggap terdekat
    return this.solutions.filter(s => s.status === 'verified');
  }

  verify(id) {
    const solution = this.solutions.find(s => s.id === id);
    if (solution) {
      solution.status = 'verified';
      this.saveToStorage();
      return true;
    }
    return false;
  }

  getStats() {
    return {
      total: this.solutions.length,
      verified: this.solutions.filter(s => s.status === 'verified').length,
      pending: this.solutions.filter(s => s.status === 'pending').length
    };
  }
}
