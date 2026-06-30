// web-pwa/js/modules/inventory/inventory-controller.js
// Manajemen stok gudang

export class InventoryController {
  constructor() {
    this.data = [];
    this.loadFromStorage();
  }

  loadFromStorage() {
    try {
      const saved = localStorage.getItem('inventoryData');
      if (saved) {
        this.data = JSON.parse(saved);
      } else {
        // Data default
        this.data = [
          { id: 1, name: 'Beras SPPH', category: 'sembako', stok: 446, min: 100, modal: 10800, het: 12500, status: 'Aman' },
          { id: 2, name: 'Minyakita', category: 'sembako', stok: 277, min: 80, modal: 13500, het: 15700, status: 'Aman' },
          { id: 3, name: 'Telur Cikarang', category: 'sembako', stok: 117, min: 50, modal: 24000, het: 27500, status: 'Aman' },
          { id: 4, name: 'Gula Pasir', category: 'sembako', stok: 198, min: 60, modal: 12000, het: 14500, status: 'Aman' },
          { id: 5, name: 'Garam Bungkus', category: 'sembako', stok: 347, min: 100, modal: 3500, het: 5000, status: 'Aman' },
          { id: 6, name: 'Teh Celup', category: 'sembako', stok: 178, min: 50, modal: 6500, het: 8500, status: 'Aman' },
          { id: 7, name: 'Mie Instan', category: 'sembako', stok: 499, min: 150, modal: 2800, het: 3500, status: 'Aman' },
          { id: 8, name: 'Susu Kental', category: 'sembako', stok: 90, min: 40, modal: 8500, het: 11000, status: 'Aman' },
          { id: 9, name: 'Air Mineral', category: 'minuman', stok: 600, min: 200, modal: 2500, het: 4000, status: 'Aman' }
        ];
        this.saveToStorage();
      }
    } catch (e) {
      console.error('[INVENTORY] Load error:', e);
    }
  }

  saveToStorage() {
    try {
      localStorage.setItem('inventoryData', JSON.stringify(this.data));
    } catch (e) {
      console.error('[INVENTORY] Save error:', e);
    }
  }

  getAll() {
    return this.data;
  }

  getByCategory(category) {
    return this.data.filter(item => item.category === category);
  }

  getLowStock() {
    return this.data.filter(item => item.stok <= item.min);
  }

  getOutOfStock() {
    return this.data.filter(item => item.stok <= 0);
  }

  update(id, data) {
    const index = this.data.findIndex(item => item.id === id);
    if (index !== -1) {
      this.data[index] = { ...this.data[index], ...data };
      this.saveToStorage();
      return true;
    }
    return false;
  }

  add(item) {
    item.id = Date.now();
    this.data.push(item);
    this.saveToStorage();
    return item;
  }

  delete(id) {
    this.data = this.data.filter(item => item.id !== id);
    this.saveToStorage();
  }

  getStats() {
    return {
      totalSku: this.data.length,
      lowStock: this.getLowStock().length,
      outOfStock: this.getOutOfStock().length,
      totalStok: this.data.reduce((sum, item) => sum + item.stok, 0)
    };
  }
}
