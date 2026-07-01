// ============================================
// DEPENDENCY-RESOLVER.JS — SembakoKita.Pro AI Agentic
// ============================================
// Tugas:
// 1. Cek package.json
// 2. Install dependencies yang kurang
// 3. Update ke versi terbaru yang aman
// ============================================

import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class DependencyResolver {
  constructor(config) {
    this.config = config;
    this.installed = [];
    this.updated = [];
    this.failed = [];
  }

  async run() {
    console.log('📦 Resolving dependencies...');
    
    // Cek package.json
    const packagePath = path.resolve(process.cwd(), 'package.json');
    if (!fs.existsSync(packagePath)) {
      console.warn('⚠️ package.json not found, skipping dependency resolution');
      return;
    }
    
    const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };
    
    for (const [name, version] of Object.entries(deps)) {
      await this.installDependency(name, version);
    }
    
    console.log(`📦 Installed ${this.installed.length}, updated ${this.updated.length}, failed ${this.failed.length}`);
    return { installed: this.installed, updated: this.updated, failed: this.failed };
  }

  async installDependency(name, version) {
    try {
      const cmd = `npm install ${name}@${version} --save`;
      await execAsync(cmd);
      this.installed.push(name);
      console.log(`✅ ${name}@${version} installed`);
    } catch (error) {
      this.failed.push({ name, version, error: error.message });
      console.error(`❌ Failed to install ${name}:`, error.message);
    }
  }
}
