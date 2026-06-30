// web-pwa/js/agent/security-guard.js
import { CONFIG } from './config.js';

export class SecurityGuard {
  constructor() {
    this.threats = [];
    this.watched = false;
    this.intervalId = null;
    this.allowedDomains = CONFIG.security.allowedDomains;
    this.watch();
  }

  isAllowedDomain(url) {
    try {
      const parsed = new URL(url);
      return this.allowedDomains.some(domain => parsed.hostname.includes(domain));
    } catch {
      return false;
    }
  }

  watch() {
    if (this.watched) return;
    this.watched = true;

    if (CONFIG.security.blockEval) {
      const originalEval = window.eval;
      window.eval = function(code) {
        if (!this.isAllowedDomain(document.location.href)) {
          this.threats.push({
            type: 'eval',
            code: code?.substring(0, 100),
            time: new Date().toISOString()
          });
          throw new Error('[SECURITY] eval() diblokir');
        }
        return originalEval(code);
      }.bind(this);
    }

    if (CONFIG.security.blockFunctionConstructor) {
      const originalFunction = window.Function;
      window.Function = function(...args) {
        const body = args[args.length - 1] || '';
        if (body.includes('eval') || body.includes('require')) {
          this.threats.push({
            type: 'function-constructor',
            body: body.substring(0, 100),
            time: new Date().toISOString()
          });
          throw new Error('[SECURITY] Function constructor diblokir');
        }
        return new originalFunction(...args);
      }.bind(this);
    }

    if (CONFIG.security.blockInternalFetch) {
      const originalFetch = window.fetch;
      window.fetch = function(url, options) {
        if (typeof url === 'string') {
          if (!this.isAllowedDomain(url)) {
            this.threats.push({
              type: 'fetch-blocked',
              url: url,
              time: new Date().toISOString()
            });
            throw new Error(`[SECURITY] Fetch ke ${url} diblokir`);
          }
        }
        return originalFetch(url, options);
      }.bind(this);
    }

    if (CONFIG.security.blockSuspiciousStorage) {
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = function(key, value) {
        if (key.includes('eval') || key.includes('backdoor')) {
          this.threats.push({
            type: 'localStorage-suspicious',
            key,
            time: new Date().toISOString()
          });
          throw new Error('[SECURITY] Penyimpanan mencurigakan diblokir');
        }
        return originalSetItem(key, value);
      }.bind(this);
    }

    if (CONFIG.security.blockDOMInjection) {
      const originalInnerHTML = Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML');
      Object.defineProperty(Element.prototype, 'innerHTML', {
        set: function(value) {
          if (typeof value === 'string' && 
              (value.includes('<script') || value.includes('onerror'))) {
            this.threats.push({
              type: 'dom-injection',
              value: value.substring(0, 100),
              time: new Date().toISOString()
            });
            throw new Error('[SECURITY] DOM injection diblokir');
          }
          return originalInnerHTML.set.call(this, value);
        }.bind(this),
        get: originalInnerHTML.get
      });
    }

    this.intervalId = setInterval(() => {
      this.scanEnvironment();
    }, CONFIG.security.scanInterval);
  }

  scanEnvironment() {
    document.querySelectorAll('script[src*="evil"], script[src*="hack"]')
      .forEach(el => el.remove());
    document.querySelectorAll('iframe[src*="evil"], iframe[src*="hack"]')
      .forEach(el => el.remove());
  }

  getThreats() {
    return this.threats;
  }

  isSafe() {
    return this.threats.length === 0;
  }

  async scanAllFiles() {
    const threats = [];
    document.querySelectorAll('script').forEach(script => {
      if (script.src && (script.src.includes('evil') || script.src.includes('hack'))) {
        threats.push({ type: 'script-src', src: script.src });
      }
      if (script.textContent?.includes('eval(')) {
        threats.push({ type: 'inline-eval', content: script.textContent.slice(0, 50) });
      }
    });
    return threats;
  }

  destroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.watched = false;
  }
}
