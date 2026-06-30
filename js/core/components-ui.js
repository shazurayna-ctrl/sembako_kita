// web-pwa/js/core/components-ui.js
// Komponen UI reusable

export class UIComponents {
  constructor() {
    this.toastTimeout = null;
  }

  // 🔥 Toast notification
  showToast(message, type = 'info', duration = 3000) {
    const existing = document.querySelector('.ui-toast');
    if (existing) existing.remove();

    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout);
      this.toastTimeout = null;
    }

    const toast = document.createElement('div');
    toast.className = 'ui-toast';
    const colors = {
      info: '#2196F3',
      success: '#4CAF50',
      warning: '#FF9800',
      error: '#f44336'
    };
    toast.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: ${colors[type] || colors.info};
      color: white;
      padding: 12px 24px;
      border-radius: 12px;
      font-size: 14px;
      z-index: 99999;
      max-width: 90%;
      text-align: center;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      animation: toastIn 0.3s ease;
      font-family: system-ui, -apple-system, sans-serif;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);

    this.toastTimeout = setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s ease';
      setTimeout(() => toast.remove(), 300);
      this.toastTimeout = null;
    }, duration);
  }

  // 📊 Loading spinner
  showLoading(target, text = 'Memuat...') {
    const container = typeof target === 'string' ? document.querySelector(target) : target;
    if (!container) return;

    const existing = container.querySelector('.ui-loading');
    if (existing) existing.remove();

    const loading = document.createElement('div');
    loading.className = 'ui-loading';
    loading.style.cssText = `
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px 20px;
      gap: 16px;
    `;
    loading.innerHTML = `
      <div style="
        width: 40px;
        height: 40px;
        border: 4px solid #e0e0e0;
        border-top-color: #2196F3;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
      "></div>
      <span style="color: #666; font-size: 14px;">${text}</span>
    `;
    container.appendChild(loading);
    return loading;
  }

  hideLoading(target) {
    const container = typeof target === 'string' ? document.querySelector(target) : target;
    if (!container) return;
    const loading = container.querySelector('.ui-loading');
    if (loading) loading.remove();
  }

  // 📋 Modal dialog
  showModal(options) {
    const { title, content, confirmText, cancelText, onConfirm, onCancel } = options;

    const overlay = document.createElement('div');
    overlay.className = 'ui-modal-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 100000;
      animation: fadeIn 0.2s ease;
    `;

    const modal = document.createElement('div');
    modal.className = 'ui-modal';
    modal.style.cssText = `
      background: white;
      border-radius: 16px;
      padding: 24px;
      max-width: 400px;
      width: 90%;
      max-height: 80vh;
      overflow-y: auto;
      box-shadow: 0 8px 32px rgba(0,0,0,0.2);
      animation: scaleIn 0.2s ease;
    `;
    modal.innerHTML = `
      <h3 style="margin: 0 0 12px 0; font-size: 18px;">${title}</h3>
      <div style="margin-bottom: 20px; color: #333; font-size: 14px; line-height: 1.6;">${content}</div>
      <div style="display: flex; gap: 12px; justify-content: flex-end;">
        <button class="ui-modal-cancel" style="
          padding: 8px 20px;
          border: none;
          border-radius: 8px;
          background: #e0e0e0;
          color: #333;
          cursor: pointer;
          font-size: 14px;
        ">${cancelText || 'Batal'}</button>
        <button class="ui-modal-confirm" style="
          padding: 8px 20px;
          border: none;
          border-radius: 8px;
          background: #2196F3;
          color: white;
          cursor: pointer;
          font-size: 14px;
        ">${confirmText || 'OK'}</button>
      </div>
    `;
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // Event listeners
    modal.querySelector('.ui-modal-cancel').addEventListener('click', () => {
      overlay.remove();
      if (onCancel) onCancel();
    });

    modal.querySelector('.ui-modal-confirm').addEventListener('click', () => {
      overlay.remove();
      if (onConfirm) onConfirm();
    });

    // Klik luar modal
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.remove();
        if (onCancel) onCancel();
      }
    });

    return overlay;
  }

  // 🔘 Tombol dengan loading state
  createButton(options) {
    const { text, onClick, loadingText, className } = options;
    const button = document.createElement('button');
    button.textContent = text;
    button.className = className || '';
    button.style.cssText = `
      padding: 10px 20px;
      border: none;
      border-radius: 8px;
      background: #2196F3;
      color: white;
      cursor: pointer;
      font-size: 14px;
      font-weight: 600;
      transition: all 0.2s ease;
    `;

    let isLoading = false;
    button.addEventListener('click', async (e) => {
      if (isLoading) return;
      isLoading = true;
      const originalText = button.textContent;
      button.textContent = loadingText || 'Memuat...';
      button.disabled = true;
      button.style.opacity = '0.7';

      try {
        await onClick(e);
      } finally {
        isLoading = false;
        button.textContent = originalText;
        button.disabled = false;
        button.style.opacity = '1';
      }
    });

    return button;
  }

  // 📋 List renderer
  renderList(container, items, template) {
    if (typeof container === 'string') {
      container = document.querySelector(container);
    }
    if (!container) return;

    container.innerHTML = '';
    for (const item of items) {
      const el = document.createElement('div');
      el.innerHTML = template(item);
      container.appendChild(el.firstElementChild);
    }
  }

  // 📊 Progress bar
  createProgress(value, max = 100, label = '') {
    const percent = Math.min((value / max) * 100, 100);
    const container = document.createElement('div');
    container.style.cssText = `
      width: 100%;
      background: #e0e0e0;
      border-radius: 8px;
      overflow: hidden;
      height: 20px;
      position: relative;
    `;
    const fill = document.createElement('div');
    fill.style.cssText = `
      width: ${percent}%;
      height: 100%;
      background: linear-gradient(90deg, #4CAF50, #8BC34A);
      transition: width 0.3s ease;
      border-radius: 8px;
    `;
    container.appendChild(fill);

    if (label) {
      const labelEl = document.createElement('span');
      labelEl.style.cssText = `
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        color: ${percent > 50 ? 'white' : '#333'};
        font-size: 12px;
        font-weight: 600;
      `;
      labelEl.textContent = label || `${Math.round(percent)}%`;
      container.appendChild(labelEl);
    }

    return container;
  }
}

// 🔥 CSS Animations
const style = document.createElement('style');
style.textContent = `
  @keyframes toastIn {
    from { opacity: 0; transform: translateX(-50%) translateY(20px); }
    to { opacity: 1; transform: translateX(-50%) translateY(0); }
  }
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  @keyframes scaleIn {
    from { opacity: 0; transform: scale(0.9); }
    to { opacity: 1; transform: scale(1); }
  }
`;
document.head.appendChild(style);

export const ui = new UIComponents();
