// ============================================
// BACKDOOR-SCANNER.SPEC.JS — Security Tests
// ============================================
// Tugas: Deteksi backdoor & celah keamanan
// ============================================

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Backdoor Scanner', () => {
  const dirsToScan = [
    'web-pwa/js',
    'web-pwa/css',
    'web-pwa/index.html',
    'backend-hub/src',
    '.ai/agent-brain'
  ];

  const dangerousPatterns = [
    { pattern: /eval\(/, severity: 'high', description: 'eval() detected' },
    { pattern: /child_process\.exec/, severity: 'high', description: 'child_process.exec detected' },
    { pattern: /require\(['"]child_process/, severity: 'high', description: 'child_process require' },
    { pattern: /process\.env/, severity: 'medium', description: 'process.env access' },
    { pattern: /localStorage\.setItem.*eval/, severity: 'high', description: 'localStorage eval' },
    { pattern: /document\.write\(/, severity: 'medium', description: 'document.write' },
    { pattern: /innerHTML\s*=\s*/, severity: 'medium', description: 'innerHTML assignment' },
    { pattern: /password\s*=\s*['"][^'"]+['"]/, severity: 'high', description: 'Hardcoded password' },
    { pattern: /api[_-]?key\s*=\s*['"][^'"]+['"]/, severity: 'high', description: 'Hardcoded API key' },
    { pattern: /secret\s*=\s*['"][^'"]+['"]/, severity: 'high', description: 'Hardcoded secret' },
    { pattern: /token\s*=\s*['"][^'"]+['"]/, severity: 'medium', description: 'Hardcoded token' },
    { pattern: /<script.*src=['"]https?:\/\/[^'"]+['"]/, severity: 'medium', description: 'External script' },
    { pattern: /window\.location\s*=\s*/, severity: 'medium', description: 'Location redirect' },
    { pattern: /location\.href\s*=\s*/, severity: 'medium', description: 'Href redirect' },
  ];

  const ignoredFiles = [
    'node_modules',
    '.git',
    'dist',
    'target',
    '.ai/agent-brain/templates',
    'backdoor-scanner.spec.js'
  ];

  function shouldScan(filePath) {
    return !ignoredFiles.some(ignored => filePath.includes(ignored));
  }

  function scanFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const findings = [];

    for (const { pattern, severity, description } of dangerousPatterns) {
      if (pattern.test(content)) {
        // Cari line number
        const lines = content.split('\n');
        for (let i = 0; i < lines.length; i++) {
          if (pattern.test(lines[i])) {
            findings.push({
              file: filePath,
              line: i + 1,
              severity,
              description,
              snippet: lines[i].trim().substring(0, 100)
            });
          }
        }
      }
    }

    return findings;
  }

  function scanDirectory(dir) {
    if (!fs.existsSync(dir)) return [];

    let findings = [];
    const files = fs.readdirSync(dir);

    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        findings = findings.concat(scanDirectory(fullPath));
      } else {
        const ext = path.extname(file);
        if (['.js', '.ts', '.html', '.json', '.rs', '.toml'].includes(ext)) {
          if (shouldScan(fullPath)) {
            findings = findings.concat(scanFile(fullPath));
          }
        }
      }
    }

    return findings;
  }

  it('should not contain high severity backdoors', () => {
    const allFindings = [];
    for (const dir of dirsToScan) {
      const dirPath = path.resolve(process.cwd(), dir);
      if (fs.existsSync(dirPath)) {
        const findings = scanDirectory(dirPath);
        allFindings.push(...findings);
      }
    }

    const highSeverity = allFindings.filter(f => f.severity === 'high');
    const mediumSeverity = allFindings.filter(f => f.severity === 'medium');

    // Log findings
    if (highSeverity.length > 0) {
      console.log('🔴 High severity findings:', highSeverity);
    }
    if (mediumSeverity.length > 0) {
      console.log('🟡 Medium severity findings:', mediumSeverity);
    }

    expect(highSeverity).toHaveLength(0);
  });

  it('should have minimal medium severity findings', () => {
    const allFindings = [];
    for (const dir of dirsToScan) {
      const dirPath = path.resolve(process.cwd(), dir);
      if (fs.existsSync(dirPath)) {
        const findings = scanDirectory(dirPath);
        allFindings.push(...findings);
      }
    }

    const mediumSeverity = allFindings.filter(f => f.severity === 'medium');
    // Allow some medium severity (like process.env, localStorage)
    expect(mediumSeverity.length).toBeLessThan(10);
  });

  it('should not contain eval() in production code', () => {
    const evalFindings = [];
    for (const dir of dirsToScan) {
      const dirPath = path.resolve(process.cwd(), dir);
      if (fs.existsSync(dirPath)) {
        const files = fs.readdirSync(dirPath);
        for (const file of files) {
          const fullPath = path.join(dirPath, file);
          if (fs.statSync(fullPath).isFile() && fullPath.endsWith('.js')) {
            if (shouldScan(fullPath)) {
              const content = fs.readFileSync(fullPath, 'utf8');
              if (content.includes('eval(') && !content.includes('// allowed')) {
                evalFindings.push(fullPath);
              }
            }
          }
        }
      }
    }
    expect(evalFindings).toHaveLength(0);
  });
});
