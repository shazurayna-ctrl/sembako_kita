// ============================================
// APP.JS — Main Application Logic
// SembakoKita.Pro v5.0
// ============================================

// Import Supabase wrapper
// import { SupaDB, getSupabaseClient } from './supabase.js';

// ============================================
// APPLICATION STATE
// ============================================
const App = {
  state: {
    currentPage: 'dashboard',
    cart: [],
    appData: {
      items: [],
      tickets: [],
      transactions: [],
      ledger: [],
      meshNodes: [],
      funds: null
    },
    theme: 'normal',
    crisisMode: false
  },

  // Charts
  charts: {
    stock: null,
    allocation: null,
    meshGrowth: null
  },

  // ============================================
  // INIT
  // ============================================
  async init() {
    console.log('🚀 SembakoKita.Pro v5.0 starting...');
    
    // Load theme
    this.state.theme = localStorage.getItem('sembakokita_theme') || 'normal';
    this.applyTheme(this.state.theme);
    
    // Load data from Supabase
    await this.loadData();
    
    // Render all UI
    this.renderAll();
    
    // Init charts
    this.initCharts();
    
    // Start background tasks
    this.startBackgroundTasks();
    
    // Setup realtime
    this.setupRealtime();
    
    console.log('✅ Application ready');
  },

  // ============================================
  // DATA LOADING
  // ============================================
  async loadData() {
    try {
      showToast('🔄 Loading data from Supabase...', 'info');
      
      const [items, tickets, transactions, ledger, meshNodes, funds] = await Promise.all([
        SupaDB.getItems(),
        SupaDB.getTickets(),
        SupaDB.getTransactions(20),
        SupaDB.getLedger(20),
        SupaDB.getMeshNodes(),
        SupaDB.getFunds()
      ]);
      
      this.state.appData = { items, tickets, transactions, ledger, meshNodes, funds };
      
      console.log('✅ Data loaded:', this.state.appData);
      showToast('✅ Data berhasil dimuat dari cloud!', 'success');
      
      return true;
    } catch (error) {
      console.error('❌ Error loading data:', error);
      showToast('⚠️ Gagal load data, menggunakan localStorage fallback', 'warning');
      
      // Fallback to localStorage
      this.state.appData.items = JSON.parse(localStorage.getItem('sembakokita_essentialItems') || '[]');
      this.state.appData.tickets = JSON.parse(localStorage.getItem('sembakokita_tickets') || '[]');
      this.state.appData.transactions = JSON.parse(localStorage.getItem('sembakokita_transactions') || '[]');
      this.state.appData.ledger = JSON.parse(localStorage.getItem('sembakokita_ledger') || '[]');
      this.state.appData.meshNodes = JSON.parse(localStorage.getItem('sembakokita_meshNodes') || '[]');
      this.state.appData.funds = JSON.parse(localStorage.getItem('sembakokita_funds') || 'null');
      
      return false;
    }
  },

  // ============================================
  // RENDER FUNCTIONS
  // ============================================
  renderAll() {
    this.renderPriceTable();
    this.renderActivityFeed();
    this.renderPosProducts();
    this.renderStockTable();
    this.renderBarterTable();
    this.renderTicketList();
    this.renderAuditTable();
    this.renderTruckList();
    this.renderMeshVisual();
    this.renderSyncLog();
    this.renderMeshTable();
    this.renderLedgerBlocks();
    this.renderLeaderboard();
    this.renderDashboardStats();
  },

  renderPriceTable() {
    const items = this.state.appData.items.filter(i => i.category === 'sembako');
    const tbody = document.getElementById('priceTable');
    if (!tbody) return;
    
    tbody.innerHTML = items.map(item => {
      const pct = (item.stock / (item.min_stock * 3)) * 100;
      let status = 'success', label = 'Aman';
      if (pct < 30) { status = 'danger'; label = 'Kritis'; }
      else if (pct < 60) { status = 'warning'; label = 'Menipis'; }
      return `<tr>
        <td><strong>${item.emoji} ${item.name}</strong></td>
        <td style="font-weight:700;color:var(--primary);">Rp ${item.het.toLocaleString('id')}</td>
        <td>${item.stock} ${item.unit}</td>
        <td><span class="badge-status badge-${status}">${label}</span></td>
      </tr>`;
    }).join('');
  },

  renderPosProducts(category = 'all') {
    const items = category === 'all' 
      ? this.state.appData.items 
      : this.state.appData.items.filter(i => i.category === category);
    const grid = document.getElementById('posProductGrid');
    if (!grid) return;
    
    grid.innerHTML = items.map(item => `
      <div class="pos-product-card" onclick="addToCart(${item.id})">
        <div class="emoji">${item.emoji}</div>
        <div class="name">${item.name}</div>
        <div class="price">Rp ${item.het.toLocaleString('id')}</div>
        <div style="font-size:10px;color:var(--text-secondary);margin-top:2px;">Stok: ${item.stock} ${item.unit}</div>
      </div>
    `).join('');
  },

  renderStockTable() {
    const items = this.state.appData.items;
    const tbody = document.getElementById('stockTable');
    if (!tbody) return;
    
    tbody.innerHTML = items.map(item => {
      const pct = (item.stock / (item.min_stock * 3)) * 100;
      let status = 'success', label = 'Aman';
      if (pct < 20) { status = 'danger'; label = 'Kritis'; }
      else if (pct < 50) { status = 'warning'; label = 'Menipis'; }
      return `<tr>
        <td><strong>${item.emoji} ${item.name}</strong></td>
        <td><span class="badge-status badge-info">${item.category}</span></td>
        <td><strong>${item.stock}</strong> ${item.unit}</td>
        <td>${item.min_stock}</td>
        <td>Rp ${item.modal.toLocaleString('id')}</td>
        <td style="font-weight:700;">Rp ${item.het.toLocaleString('id')}</td>
        <td><span class="badge-status badge-${status}">${label}</span></td>
        <td><button class="btn btn-outline btn-sm" onclick="adjustStock(${item.id})"><i class="bi bi-pencil"></i></button></td>
      </tr>`;
    }).join('');
  },

  renderDashboardStats() {
    const funds = this.state.appData.funds;
    if (!funds) return;
    
    document.getElementById('statDana').textContent = 'Rp ' + funds.balance.toLocaleString('id');
    document.getElementById('statWarga').textContent = '1,247';
    document.getElementById('statStok').textContent = this.state.appData.items.reduce((s, i) => s + i.stock, 0);
    document.getElementById('statDarurat').textContent = this.state.appData.tickets.filter(t => t.priority === 'darurat' && t.status !== 'selesai').length;
    document.getElementById('statMesh').textContent = this.state.appData.meshNodes.filter(n => n.status === 'active').length;
  },

  // ... more render functions ...

  // ============================================
  // CHARTS
  // ============================================
  initCharts() {
    // Stock Chart
    const stockCtx = document.getElementById('stockChart');
    if (stockCtx) {
      this.charts.stock = new Chart(stockCtx, {
        type: 'bar',
        data: {
          labels: ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'],
          datasets: [
            { label: 'Stok Masuk', data: [120, 85, 150, 95, 130, 110, 145], backgroundColor: 'rgba(5, 150, 105, 0.7)', borderRadius: 4 },
            { label: 'Stok Keluar', data: [95, 110, 80, 120, 105, 90, 100], backgroundColor: 'rgba(220, 38, 38, 0.5)', borderRadius: 4 }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { position: 'top', labels: { font: { size: 11 } } } },
          scales: { y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' } }, x: { grid: { display: false } } }
        }
      });
    }

    // Allocation Chart
    const allocCtx = document.getElementById('allocationChart');
    if (allocCtx) {
      this.charts.allocation = new Chart(allocCtx, {
        type: 'doughnut',
        data: {
          labels: ['Beli Sembako (50%)', 'Subsidi Harga (30%)', 'Ops & Mesh (20%)'],
          datasets: [{
            data: [50, 30, 20],
            backgroundColor: ['#16a34a', '#2563eb', '#d97706'],
            borderWidth: 0
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { position: 'bottom', labels: { font: { size: 11 }, padding: 12 } } },
          cutout: '65%'
        }
      });
    }
  },

  // ============================================
  // THEME
  // ============================================
  applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    this.state.theme = theme;
    localStorage.setItem('sembakokita_theme', theme);
    
    document.querySelectorAll('.theme-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.theme === theme);
    });
  },

  setTheme(theme) {
    this.applyTheme(theme);
    showToast(`🎨 Tema diubah ke ${theme}`, 'info');
  },

  // ============================================
  // REALTIME
  // ============================================
  setupRealtime() {
    // Subscribe to items
    SupaDB.subscribeToTable('items', async (payload) => {
      console.log('🔄 Items changed:', payload);
      await this.loadData();
      this.renderPriceTable();
      this.renderStockTable();
      this.renderPosProducts();
      this.renderDashboardStats();
    });

    // Subscribe to tickets
    SupaDB.subscribeToTable('tickets', async (payload) => {
      console.log('🔄 Tickets changed:', payload);
      await this.loadData();
      this.renderTicketList();
    });

    // Subscribe to funds
    SupaDB.subscribeToTable('funds', async (payload) => {
      console.log('🔄 Funds changed:', payload);
      await this.loadData();
      this.renderDashboardStats();
      this.renderAuditTable();
    });

    console.log('📡 Realtime subscriptions aktif');
  },

  // ============================================
  // BACKGROUND TASKS
  // ============================================
  startBackgroundTasks() {
    // Auto backup
    setInterval(() => {
      console.log('🔄 Auto-backup running...');
    }, 3600000);

    // Check battery
    setInterval(() => this.checkBattery(), 30000);

    // Update clock
    setInterval(() => {
      const syncEl = document.getElementById('lastSync');
      if (syncEl) {
        syncEl.textContent = new Date().toLocaleTimeString('id');
      }
    }, 60000);
  },

  checkBattery() {
    if ('getBattery' in navigator) {
      navigator.getBattery().then(battery => {
        const level = Math.round(battery.level * 100);
        document.getElementById('batteryLevel').textContent = level + '%';
        
        if (level < 15) {
          this.setTheme('survival');
          showToast('🔋 Baterai < 15%! Switch ke mode Survival', 'warning');
        }
      });
    }
  },

  // ============================================
  // NAVIGATION
  // ============================================
  navigateTo(page) {
    this.state.currentPage = page;
    
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const target = document.getElementById('page-' + page);
    if (target) target.classList.add('active');
    
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    const navItem = document.querySelector(`.nav-item[data-page="${page}"]`);
    if (navItem) navItem.classList.add('active');
    
    if (window.innerWidth <= 768) {
      this.toggleSidebar();
    }
  },

  toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    if (sidebar) sidebar.classList.toggle('open');
    if (overlay) overlay.classList.toggle('active');
  },

  // ============================================
  // TOAST
  // ============================================
  showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = 'toast ' + type;
    const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
    toast.innerHTML = `<span class="toast-icon">${icons[type]}</span><span class="toast-message">${message}</span>`;
    container.appendChild(toast);
    
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  },

  // ============================================
  // UTILITY
  // ============================================
  simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    const hex = Math.abs(hash).toString(16).padStart(16, '0');
    return hex + hex.substring(0, 16) + hex.substring(0, 16) + hex.substring(0, 16);
  }
};

// ============================================
// EXPOSE TO GLOBAL
// ============================================
window.App = App;
window.showToast = (msg, type) => App.showToast(msg, type);
window.navigateTo = (page) => App.navigateTo(page);
window.toggleSidebar = () => App.toggleSidebar();
window.setTheme = (theme) => App.setTheme(theme);
window.simpleHash = (str) => App.simpleHash(str);

// ============================================
// BOOT
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});

console.log('📦 App.js loaded');
