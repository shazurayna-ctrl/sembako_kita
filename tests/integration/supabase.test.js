// ============================================
// SUPABASE.TEST.JS — SembakoKita.Pro Integration
// ============================================
// Tugas: Test integrasi dengan Supabase
// ============================================

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { supabase } from '../../web-pwa/js/core/supabase.js';

describe('Supabase Integration', () => {
  let testId;

  beforeAll(async () => {
    // Setup: Buat data test
    const result = await supabase.insert('test_items', {
      name: 'Test Item',
      price: 10000,
      stock: 50
    });
    testId = result.data?.[0]?.id;
  });

  afterAll(async () => {
    // Cleanup: Hapus data test
    if (testId) {
      await supabase.delete('test_items', testId);
    }
  });

  it('should connect to Supabase', () => {
    expect(supabase).toBeDefined();
    expect(supabase.client).toBeDefined();
  });

  it('should insert data', async () => {
    const result = await supabase.insert('test_items', {
      name: 'Test Insert',
      price: 20000,
      stock: 100
    });
    expect(result.data).toBeDefined();
    expect(result.error).toBeNull();
  });

  it('should select data', async () => {
    const result = await supabase.select('test_items');
    expect(result.data).toBeDefined();
    expect(Array.isArray(result.data)).toBe(true);
  });

  it('should update data', async () => {
    if (!testId) return;
    const result = await supabase.update('test_items', {
      id: testId,
      stock: 75
    });
    expect(result.error).toBeNull();
  });

  it('should delete data', async () => {
    const result = await supabase.delete('test_items', testId);
    expect(result.error).toBeNull();
  });
});
