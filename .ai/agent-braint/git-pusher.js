// ============================================
// GIT-PUSHER.JS — SembakoKita.Pro AI Agentic
// ============================================
// Tugas:
// 1. Stage semua perubahan
// 2. Commit dengan pesan otomatis
// 3. Push ke GitHub
// ============================================

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class GitPusher {
  constructor(config) {
    this.config = config;
    this.version = config.version || '2026.07.01';
    this.commitMessage = `🚀 Auto-build v${this.version} — AI Agentic`;
  }

  async run() {
    console.log('📤 Pushing to GitHub...');
    
    try {
      // Stage
      await execAsync('git add .');
      console.log('✅ Staged');
      
      // Commit
      await execAsync(`git commit -m "${this.commitMessage}"`);
      console.log('✅ Committed');
      
      // Push
      await execAsync('git push origin main');
      console.log('✅ Pushed to GitHub');
      
      return { success: true, message: this.commitMessage };
      
    } catch (error) {
      console.error('❌ Git push failed:', error.message);
      return { success: false, error: error.message };
    }
  }
}
