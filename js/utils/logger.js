// ============================================
// LOGGER.JS — SembakoKita.Pro v2026.07.01
// ============================================
// Logging sistem: debug + audit trail
// ============================================

export class Logger {
  constructor() {
    this.levels = {
      DEBUG: 0,
      INFO: 1,
      WARN: 2,
      ERROR: 3,
      NONE: 4
    };
    this.level = this.levels.DEBUG;
    this.logs = [];
    this.maxLogs = 500;
    this.auditTrail = [];
    this.isEnabled = true;
    this.init();
  }

  // ============================================
  // INIT — Setup Console Override
  // ============================================
  init() {
    // Cek mode debug dari localStorage
    const debugMode = localStorage.getItem('debugMode');
    if (debugMode === 'false') {
      this.level = this.levels.NONE;
      this.isEnabled = false;
    }

    // Simpan console asli
    this.originalLog = console.log;
    this.originalWarn = console.warn;
    this.originalError = console.error;
    this.originalInfo = console.info;

    // Override console.log
    console.log = (...args) => {
      this.log('DEBUG', args);
      this.originalLog(...args);
    };

    // Override console.warn
    console.warn = (...args) => {
      this.log('WARN', args);
      this.originalWarn(...args);
    };

    // Override console.error
    console.error = (...args) => {
      this.log('ERROR', args);
      this.originalError(...args);
    };

    // Override console.info
    console.info = (...args) => {
      this.log('INFO', args);
      this.originalInfo(...args);
    };

    console.log('[LOGGER] Initialized');
  }

  // ============================================
  // LOG — Logging Utama
  // ============================================
  log(level, args) {
    if (!this.isEnabled) return;
    
    const levelNum = this.levels[level] || this.levels.INFO;
    if (levelNum < this.level) return;

    const logEntry = {
      level: level,
      time: new Date().toISOString(),
      message: args.map(arg => {
        if (typeof arg === 'object') {
          try {
            return JSON.stringify(arg);
          } catch {
            return '[Object]';
          }
        }
        return String(arg);
      }).join(' ')
    };

    this.logs.unshift(logEntry);
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }

    // Simpan ke IndexedDB (async)
    this.saveToDB(logEntry);
  }

  // ============================================
  // AUDIT — Audit Trail
  // ============================================
  audit(action, data, user = 'system') {
    const auditEntry = {
      id: Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6),
      action: action,
      data: data,
      user: user,
      time: new Date().toISOString(),
      ip: this.getIP()
    };
    this.auditTrail.unshift(auditEntry);
    this.log('INFO', [`AUDIT: ${action}`, data]);

    // Simpan audit ke IndexedDB
    this.saveAuditToDB(auditEntry);
    return auditEntry;
  }

  // ============================================
  // GET LOGS — Ambil Log
  // ============================================
  getLogs(level = null, limit = 100) {
    let filtered = this.logs;
    if (level) {
      filtered = filtered.filter(log => log.level === level);
    }
    return filtered.slice(0, limit);
  }

  // ============================================
  // GET AUDIT — Ambil Audit
  // ============================================
  getAudit(limit = 50) {
    return this.auditTrail.slice(0, limit);
  }

  // ============================================
  // SEARCH — Cari Log
  // ============================================
  search(query) {
    return this.logs.filter(log => 
      log.message.toLowerCase().includes(query.toLowerCase())
    );
  }

  // ============================================
  // INDEXEDDB — Simpan Log
  // ============================================
  async saveToDB(logEntry) {
    try {
      const db = await this.openDB();
      const tx = db.transaction('logs', 'readwrite');
      const store = tx.objectStore('logs');
      await store.add(logEntry);
    } catch (e) {
      // Gagal simpan, abaikan (tidak critical)
    }
  }

  // ============================================
  // INDEXEDDB — Simpan Audit
  // ============================================
  async saveAuditToDB(auditEntry) {
    try {
      const db = await this.openDB();
      const tx = db.transaction('audit', 'readwrite');
      const store = tx.objectStore('audit');
      await store.add(auditEntry);
    } catch (e) {
      // Gagal simpan, abaikan
    }
  }

  // ============================================
  // INDEXEDDB — Buka Database
  // ============================================
  openDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('SembakoDB', 1);
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('logs')) {
          db.createObjectStore('logs', { keyPath: 'time' });
        }
        if (!db.objectStoreNames.contains('audit')) {
          db.createObjectStore('audit', { keyPath: 'id' });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // ============================================
  // UTILITY — Get IP
  // ============================================
  getIP() {
    try {
      return 'local';
    } catch {
      return 'unknown';
    }
  }

  // ============================================
  // CLEAR — Hapus Log
  // ============================================
  clearLogs() {
    this.logs = [];
  }

  // ============================================
  // CLEAR — Hapus Audit
  // ============================================
  clearAudit() {
    this.auditTrail = [];
  }

  // ============================================
  // SET LEVEL — Ubah Level Logging
  // ============================================
  setLevel(level) {
    if (this.levels[level] !== undefined) {
      this.level = this.levels[level];
      localStorage.setItem('debugMode', level === 'DEBUG' ? 'true' : 'false');
      this.isEnabled = level !== 'NONE';
    }
  }

  // ============================================
  // GET STATS — Statistik Log
  // ============================================
  getStats() {
    return {
      totalLogs: this.logs.length,
      totalAudit: this.auditTrail.length,
      levels: {
        DEBUG: this.logs.filter(l => l.level === 'DEBUG').length,
        INFO: this.logs.filter(l => l.level === 'INFO').length,
        WARN: this.logs.filter(l => l.level === 'WARN').length,
        ERROR: this.logs.filter(l => l.level === 'ERROR').length
      }
    };
  }

  // ============================================
  // EXPORT — Export Log ke Text
  // ============================================
  exportLogs() {
    let text = `========================================\n`;
    text += `  LOG EXPORT — SembakoKita.Pro\n`;
    text += `  Waktu: ${new Date().toISOString()}\n`;
    text += `========================================\n\n`;
    
    for (const log of this.logs.slice(0, 100)) {
      text += `[${log.time}] [${log.level}] ${log.message}\n`;
    }
    
    return text;
  }

  // ============================================
  // DESTROY — Cleanup
  // ============================================
  destroy() {
    // Kembalikan console asli
    console.log = this.originalLog;
    console.warn = this.originalWarn;
    console.error = this.originalError;
    console.info = this.originalInfo;
    console.log('[LOGGER] Destroyed');
  }
}

// Export singleton
export const logger = new Logger();
