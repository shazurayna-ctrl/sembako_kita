// web-pwa/js/synchronization/conflict-resolver.js
// Atasi konflik data antara offline dan online

export class ConflictResolver {
  constructor() {
    this.strategies = {
      'server-wins': this.serverWins.bind(this),
      'client-wins': this.clientWins.bind(this),
      'merge': this.merge.bind(this),
      'manual': this.manual.bind(this)
    };
    this.defaultStrategy = 'server-wins';
  }

  // 🔥 Resolusi konflik utama
  resolve(conflict) {
    const strategy = conflict.strategy || this.defaultStrategy;
    const resolver = this.strategies[strategy] || this.strategies['server-wins'];
    return resolver(conflict);
  }

  // 📌 Strategi 1: Server menang (data dari server dianggap benar)
  serverWins(conflict) {
    return {
      resolved: true,
      data: conflict.serverData,
      source: 'server',
      timestamp: new Date().toISOString()
    };
  }

  // 📌 Strategi 2: Client menang (data dari client dianggap benar)
  clientWins(conflict) {
    return {
      resolved: true,
      data: conflict.clientData,
      source: 'client',
      timestamp: new Date().toISOString()
    };
  }

  // 📌 Strategi 3: Merge (gabungkan kedua data)
  merge(conflict) {
    const merged = { ...conflict.serverData, ...conflict.clientData };
    
    // Untuk field yang bertabrakan, pilih yang lebih baru
    for (const key of Object.keys(merged)) {
      if (conflict.serverData[key] && conflict.clientData[key]) {
        const serverTime = conflict.serverData._timestamp || 0;
        const clientTime = conflict.clientData._timestamp || 0;
        if (serverTime > clientTime) {
          merged[key] = conflict.serverData[key];
        } else {
          merged[key] = conflict.clientData[key];
        }
      }
    }

    return {
      resolved: true,
      data: merged,
      source: 'merge',
      timestamp: new Date().toISOString()
    };
  }

  // 📌 Strategi 4: Manual (butuh intervensi user)
  manual(conflict) {
    return {
      resolved: false,
      conflict: conflict,
      message: 'Konflik data. Pilih versi yang benar.',
      options: ['server', 'client', 'merge'],
      timestamp: new Date().toISOString()
    };
  }

  // 🧪 Deteksi konflik antara dua data
  detectConflict(serverData, clientData) {
    const conflicts = [];
    const allKeys = new Set([...Object.keys(serverData), ...Object.keys(clientData)]);

    for (const key of allKeys) {
      if (serverData[key] !== undefined && clientData[key] !== undefined) {
        if (JSON.stringify(serverData[key]) !== JSON.stringify(clientData[key])) {
          conflicts.push({
            key: key,
            serverValue: serverData[key],
            clientValue: clientData[key]
          });
        }
      }
    }

    return {
      hasConflict: conflicts.length > 0,
      conflicts: conflicts,
      serverData: serverData,
      clientData: clientData
    };
  }

  // 🔄 Auto-resolve dengan strategi default
  autoResolve(serverData, clientData, strategy = 'server-wins') {
    const conflict = this.detectConflict(serverData, clientData);
    if (!conflict.hasConflict) {
      return {
        resolved: true,
        data: serverData,
        source: 'no-conflict',
        timestamp: new Date().toISOString()
      };
    }

    return this.resolve({
      serverData: serverData,
      clientData: clientData,
      strategy: strategy,
      conflict: conflict
    });
  }
}
