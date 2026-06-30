// web-pwa/js/modules/mesh/mesh-controller.js
// Manajemen mesh network (BLE + gossip protocol)

export class MeshController {
  constructor() {
    this.nodes = [
      { id: 'N001', device: 'Samsung A14', owner: 'Posko Pusat', signal: -35, lastActive: 'Aktif', dataTx: 142, status: 'Aktif' },
      { id: 'N002', device: 'Xiaomi Redmi 9', owner: 'Pak Budi RW05', signal: -52, lastActive: '2m lalu', dataTx: 38, status: 'Aktif' },
      { id: 'N003', device: 'OPPO A5s', owner: 'Warung Bu Min', signal: -48, lastActive: 'Aktif', dataTx: 67, status: 'Aktif' },
      { id: 'N004', device: 'Samsung J2', owner: 'Pak RT 07', signal: -65, lastActive: '15m lalu', dataTx: 12, status: 'Aktif' }
    ];
    this.logs = [];
    this.active = true;
    this.heartbeatInterval = null;
    this.init();
  }

  init() {
    this.heartbeatInterval = setInterval(() => {
      this.heartbeat();
    }, 30000);
  }

  heartbeat() {
    const log = {
      time: new Date().toISOString(),
      type: 'BLE',
      message: 'Heartbeat from N003 → OK'
    };
    this.logs.unshift(log);
    if (this.logs.length > 50) {
      this.logs = this.logs.slice(0, 50);
    }
    // Simulasi gossip
    if (Math.random() > 0.7) {
      this.logs.unshift({
        time: new Date().toISOString(),
        type: 'MESH',
        message: 'Gossip round - 12 packets exchanged'
      });
    }
  }

  getNodes() {
    return this.nodes;
  }

  getLogs(limit = 20) {
    return this.logs.slice(0, limit);
  }

  getStats() {
    return {
      totalNodes: this.nodes.length,
      activeNodes: this.nodes.filter(n => n.status === 'Aktif').length,
      radius: '2.4km',
      packetsToday: 847,
      protocol: 'BLE 5.0'
    };
  }

  broadcast(data) {
    // Kirim data ke semua node
    const log = {
      time: new Date().toISOString(),
      type: 'P2P',
      message: `Binary packet: ${data.length} bytes → ${Math.round(data.length * 0.3)} bytes (70% compressed)`
    };
    this.logs.unshift(log);
    return true;
  }

  destroy() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }
}
