// web-pwa/js/utils/logger.js
// Logging sistem: debug + audit

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
    this.init();
  }

  init() {
    // Cek mode debug dari localStorage
    const debugMode = localStorage.getItem('debugMode');
    if (debugMode === 'true') {
      this.level = this.levels.DEBUG;
    }

    // Tangkap console.log asli
    this.originalLog = console.log;
    this.originalWarn = console.warn;
    this.originalError = console.error;

    console.log = (...args) => {
      this.log('DEBUG', args);
      this.originalLog(...args);
    };

    console.warn = (...args) => {
      this.log('WARN', args);
      this.originalWarn(...args);
    };

    console.error = (...args) => {
      this.log('ERROR', args);
      this.originalError(...args);
    };
  }

  // 🔥 Logging utama
  log(level, args) {
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

    // Simpan ke IndexedDB
    this.saveToDB(logEntry);
  }

  // 📝 Audit trail (transaksi penting)
  audit(action, data, user = 'system') {
    const auditEntry = {
      id: Date.now().toString(36),
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

  // 📊 Get logs
  getLogs(level = null, limit = 100) {
    let filtered = this.logs;
    if (level) {
      filtered = filtered.filter(log => log.level === level);
    }
    return filtered.slice(0, limit);
  }

  // 📊 Get audit trail
  getAudit(limit = 50) {
    return this.auditTrail.slice(0, limit);
  }

  // 🔍 Search logs
  search(query) {
    return this.logs.filter(log => 
      log.message.toLowerCase().includes(query.toLowerCase())
    );
  }

  // 🗄️ Simpan log ke IndexedDB
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

  // 🗄️ Simpan audit ke IndexedDB
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

  // 🗄️ Buka IndexedDB
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

  // 🌐 Get IP (sederhana)
  getIP() {
    try {
      return 'local';
    } catch {
      return 'unknown';
    }
  }

  // 🧹 Clear logs
  clearLogs() {
    this.logs = [];
  }

  // 🧹 Clear audit
  clearAudit() {
    this.auditTrail = [];
  }

  // 🔧 Set level
  setLevel(level) {
    if (this.levels[level] !== undefined) {
      this.level = this.levels[level];
      localStorage.setItem('debugMode', level === 'DEBUG' ? 'true' : 'false');
    }
  }

  // 📊 Get stats
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
}

// Export singleton
export const logger = new Logger();
