// ============================================
// GOSSIP-PROTOCOL.SERVICE.TS — SembakoKita.Pro
// ============================================
// Tugas:
// 1. Manajemen node mesh
// 2. Gossip protocol (peer-to-peer)
// 3. Broadcast & sync data
// ============================================

import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

export interface MeshNode {
  id: string;
  device: string;
  owner: string;
  signal: number;
  lastSeen: string;
  dataTx: number;
  status: 'active' | 'inactive';
}

export interface GossipPacket {
  id: string;
  from: string;
  to: string[];
  type: 'heartbeat' | 'data' | 'sync' | 'alert';
  payload: any;
  timestamp: string;
  ttl: number;
}

@Injectable()
export class GossipProtocolService {
  private readonly logger = new Logger(GossipProtocolService.name);
  private nodes: Map<string, MeshNode> = new Map();
  private packets: GossipPacket[] = [];
  private readonly MAX_HOPS = 5;
  private readonly GOSSIP_INTERVAL = 30000; // 30 detik

  constructor(private eventEmitter: EventEmitter2) {
    this.startGossip();
  }

  // ============================================
  // REGISTER NODE
  // ============================================
  registerNode(node: Omit<MeshNode, 'lastSeen'>): MeshNode {
    const fullNode: MeshNode = {
      ...node,
      lastSeen: new Date().toISOString(),
    };
    this.nodes.set(node.id, fullNode);
    this.logger.log(`📡 Node registered: ${node.id} (${node.device})`);
    
    this.eventEmitter.emit('mesh.node.joined', fullNode);
    return fullNode;
  }

  // ============================================
  // HEARTBEAT
  // ============================================
  heartbeat(nodeId: string): boolean {
    const node = this.nodes.get(nodeId);
    if (!node) {
      this.logger.warn(`⚠️ Unknown node: ${nodeId}`);
      return false;
    }
    node.lastSeen = new Date().toISOString();
    node.status = 'active';
    this.logger.debug(`❤️ Heartbeat from ${nodeId}`);
    return true;
  }

  // ============================================
  // GOSSIP BROADCAST
  // ============================================
  gossip(packet: Omit<GossipPacket, 'id' | 'timestamp'>): string {
    const id = this.generateId();
    const fullPacket: GossipPacket = {
      ...packet,
      id,
      timestamp: new Date().toISOString(),
      ttl: packet.ttl || this.MAX_HOPS,
    };

    // Broadcast ke semua node (kecuali pengirim)
    const recipients = Array.from(this.nodes.keys())
      .filter(id => id !== packet.from && this.nodes.get(id)?.status === 'active');

    // Simpan packet
    this.packets.push(fullPacket);
    if (this.packets.length > 1000) {
      this.packets = this.packets.slice(-500);
    }

    this.logger.log(`📤 Gossip: ${fullPacket.type} from ${packet.from} to ${recipients.length} nodes`);
    this.eventEmitter.emit('mesh.gossip.sent', fullPacket);

    return id;
  }

  // ============================================
  // GOSSIP LOOP
  // ============================================
  private startGossip() {
    setInterval(() => {
      this.runGossipRound();
    }, this.GOSSIP_INTERVAL);
  }

  private runGossipRound() {
    const activeNodes = Array.from(this.nodes.values())
      .filter(n => n.status === 'active');

    if (activeNodes.length < 2) return;

    // Pilih random node untuk gossip
    const randomNode = activeNodes[Math.floor(Math.random() * activeNodes.length)];
    const peers = activeNodes
      .filter(n => n.id !== randomNode.id)
      .slice(0, 3);

    if (peers.length === 0) return;

    const packet: Omit<GossipPacket, 'id' | 'timestamp'> = {
      from: randomNode.id,
      to: peers.map(p => p.id),
      type: 'heartbeat',
      payload: { data: 'gossip_round' },
      ttl: 3,
    };

    this.gossip(packet);
    this.logger.debug(`🔄 Gossip round: ${randomNode.id} → ${peers.map(p => p.id).join(', ')}`);
  }

  // ============================================
  // GET NODES
  // ============================================
  getNodes(): MeshNode[] {
    return Array.from(this.nodes.values());
  }

  getActiveNodes(): MeshNode[] {
    return Array.from(this.nodes.values()).filter(n => n.status === 'active');
  }

  getNode(id: string): MeshNode | null {
    return this.nodes.get(id) || null;
  }

  // ============================================
  // GET STATS
  // ============================================
  getStats() {
    const all = Array.from(this.nodes.values());
    const active = all.filter(n => n.status === 'active');
    return {
      total: all.length,
      active: active.length,
      inactive: all.length - active.length,
      packets: this.packets.length,
      lastGossip: this.packets[this.packets.length - 1]?.timestamp || null,
    };
  }

  // ============================================
  // UTILITY
  // ============================================
  private generateId(): string {
    return Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 8);
  }
}
