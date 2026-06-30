// ============================================
// ORCHESTRATOR.JS — SembakoKita.Pro AI Agentic
// ============================================
// Tugas:
// 1. Baca trigger dari .sembako-builder.json
// 2. Jalankan semua agent secara berurutan
// 3. Pantau status & error
// ============================================

import { FileGenerator } from './file-generator.js';
import { SecurityScanner } from './security-scanner.js';
import { DependencyResolver } from './dependency-resolver.js';
import { SelfHealer } from './self-healer.js';
import { GitPusher } from './git-pusher.js';
import fs from 'fs';
import path from 'path';

export class Orchestrator {
  constructor() {
    this.config = null;
    this.status = {
      step: 'idle',
      progress: 0,
      errors: [],
      logs: []
    };
    this.startTime = null;
    this.endTime = null;
  }

  async run() {
    this.startTime = Date.now();
    this.log('🚀 Orchestrator started');
    
    try {
      // STEP 1: Baca trigger
      this.status.step = 'reading-trigger';
      this.status.progress = 5;
      await this.loadConfig();
      
      // STEP 2: Generate semua file
      this.status.step = 'generating-files';
      this.status.progress = 15;
      await this.generateFiles();
      
      // STEP 3: Scan keamanan
      this.status.step = 'security-scan';
      this.status.progress = 40;
      await this.scanSecurity();
      
      // STEP 4: Resolve dependencies
      this.status.step = 'resolving-dependencies';
      this.status.progress = 60;
      await this.resolveDependencies();
      
      // STEP 5: Self-heal (jika ada error)
      this.status.step = 'self-healing';
      this.status.progress = 80;
      await this.selfHeal();
      
      // STEP 6: Push ke GitHub
      this.status.step = 'pushing-to-git';
      this.status.progress = 90;
      await this.pushToGit();
      
      // SELESAI
      this.status.step = 'done';
      this.status.progress = 100;
      this.endTime = Date.now();
      
      this.log('✅ Orchestrator completed in ' + ((this.endTime - this.startTime) / 1000) + 's');
      return this.status;
      
    } catch (error) {
      this.status.errors.push(error.message);
      this.log('❌ Orchestrator failed: ' + error.message);
      throw error;
    }
  }

  async loadConfig() {
    const configPath = path.resolve(process.cwd(), '.sembako-builder.json');
    if (!fs.existsSync(configPath)) {
      throw new Error('Trigger file .sembako-builder.json tidak ditemukan!');
    }
    const raw = fs.readFileSync(configPath, 'utf8');
    this.config = JSON.parse(raw);
    this.log('📄 Trigger loaded:', this.config);
  }

  async generateFiles() {
    const generator = new FileGenerator(this.config);
    await generator.run();
    this.log('📦 Files generated');
  }

  async scanSecurity() {
    const scanner = new SecurityScanner(this.config);
    const result = await scanner.run();
    if (result.threats > 0) {
      throw new Error(`Security scan found ${result.threats} threats!`);
    }
    this.log('🔒 Security scan passed');
  }

  async resolveDependencies() {
    const resolver = new DependencyResolver(this.config);
    await resolver.run();
    this.log('📦 Dependencies resolved');
  }

  async selfHeal() {
    const healer = new SelfHealer(this.config);
    await healer.run();
    this.log('🩹 Self-heal completed');
  }

  async pushToGit() {
    const pusher = new GitPusher(this.config);
    await pusher.run();
    this.log('📤 Pushed to GitHub');
  }

  log(message) {
    const timestamp = new Date().toISOString();
    const log = `[${timestamp}] ${message}`;
    this.status.logs.push(log);
    console.log(log);
  }

  getStatus() {
    return this.status;
  }
}

// ============================================
// EKSEKUSI
// ============================================
if (import.meta.url === `file://${process.argv[1]}`) {
  const orchestrator = new Orchestrator();
  orchestrator.run()
    .then(() => {
      console.log('✅ Build completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Build failed:', error);
      process.exit(1);
    });
}

export default Orchestrator;
