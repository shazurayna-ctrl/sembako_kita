// ============================================
// SECURITY-SCANNER.JS — SembakoKita.Pro AI Agentic
// ============================================
// Tugas:
// 1. Scan semua file untuk backdoor
// 2. Deteksi eval(), require(), import() mencurigakan
// 3. Deteksi hardcoded credentials
// ============================================

import fs from 'fs';
import path from 'path';

export class SecurityScanner {
  constructor(config) {
    this.config = config;
    this.threats = [];
    this.filesScanned = 0;
  }

  async run() {
    console.log('🔒 Running security scan...');
    
    const dirs = ['web-pwa', 'src-tauri', '.ai'];
    for (const dir of dirs) {
      await this.scanDirectory(dir);
    }
    
    console.log(`🔒 Scanned ${this.filesScanned} files, found ${this.threats.length} threats`);
    return { threats: this.threats.length, details: this.threats };
  }

  async scanDirectory(dir) {
    if (!fs.existsSync(dir)) return;
    
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        await this.scanDirectory(fullPath);
      } else if (this.shouldScan(file)) {
        await this.scanFile(fullPath);
      }
    }
  }

  shouldScan(file) {
    const extensions = ['.js', '.ts', '.html', '.json', '.rs', '.toml'];
    return extensions.some(ext => file.endsWith(ext));
  }

  async scanFile(filePath) {
    this.filesScanned++;
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Cek eval()
    if (content.includes('eval(') && !content.includes('// allowed')) {
      this.threats.push({
        file: filePath,
        type: 'eval',
        line: this.getLineNumber(content, 'eval(')
      });
    }
    
    // Cek hardcoded credentials
    const credPatterns = [
      /password\s*=\s*['"][^'"]+['"]/i,
      /api[_-]?key\s*=\s*['"][^'"]+['"]/i,
      /secret\s*=\s*['"][^'"]+['"]/i,
      /token\s*=\s*['"][^'"]+['"]/i,
    ];
    for (const pattern of credPatterns) {
      if (pattern.test(content)) {
        this.threats.push({
          file: filePath,
          type: 'hardcoded-credential',
          pattern: pattern.source
        });
      }
    }
    
    // Cek backdoor pattern
    if (content.includes('child_process') && content.includes('exec')) {
      this.threats.push({
        file: filePath,
        type: 'backdoor',
        description: 'child_process.exec detected'
      });
    }
  }

  getLineNumber(content, keyword) {
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes(keyword)) return i + 1;
    }
    return -1;
  }
}
