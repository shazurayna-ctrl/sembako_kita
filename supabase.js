// ============================================
// SUPABASE CLIENT WRAPPER
// ============================================

// GANTI DENGAN CREDENTIALS ANDA
const SUPABASE_CONFIG = {
  url: 'https://your-project-id.supabase.co',
  anonKey: 'your-anon-key-here'
};

// ============================================
// SUPABASE CLIENT
// ============================================
let supabaseInstance = null;

function getSupabaseClient() {
  if (!supabaseInstance) {
    if (typeof supabase === 'undefined') {
      console.error('❌ Supabase SDK not loaded!');
      return null;
    }
    supabaseInstance = supabase.createClient(
      SUPABASE_CONFIG.url,
      SUPABASE_CONFIG.anonKey,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true
        },
        realtime: {
          params: {
            eventsPerSecond: 10
          }
        }
      }
    );
    console.log('🔗 Supabase client initialized');
  }
  return supabaseInstance;
}

// ============================================
// SUPABASE DATA ACCESS LAYER
// ============================================
const SupaDB = {
  // ---- CONNECTION TEST ----
  async testConnection() {
    try {
      const supabase = getSupabaseClient();
      if (!supabase) return false;
      const { data, error } = await supabase
        .from('items')
        .select('count', { count: 'exact', head: true });
      if (error) throw error;
      console.log('✅ Supabase connection OK');
      return true;
    } catch (error) {
      console.error('❌ Supabase connection failed:', error);
      return false;
    }
  },

  // ---- ITEMS ----
  async getItems() {
    const supabase = getSupabaseClient();
    if (!supabase) return [];
    try {
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .order('id');
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('❌ Error getting items:', error);
      return [];
    }
  },

  async getItem(id) {
    const supabase = getSupabaseClient();
    if (!supabase) return null;
    try {
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Error getting item:', error);
      return null;
    }
  },

  async updateItem(id, updates) {
    const supabase = getSupabaseClient();
    if (!supabase) return null;
    try {
      const { data, error } = await supabase
        .from('items')
        .update({ ...updates, updated_at: new Date() })
        .eq('id', id)
        .select();
      if (error) throw error;
      return data ? data[0] : null;
    } catch (error) {
      console.error('❌ Error updating item:', error);
      return null;
    }
  },

  async updateStock(id, newStock) {
    return this.updateItem(id, { stock: newStock });
  },

  async addItem(item) {
    const supabase = getSupabaseClient();
    if (!supabase) return null;
    try {
      const { data, error } = await supabase
        .from('items')
        .insert([item])
        .select();
      if (error) throw error;
      return data ? data[0] : null;
    } catch (error) {
      console.error('❌ Error adding item:', error);
      return null;
    }
  },

  async deleteItem(id) {
    const supabase = getSupabaseClient();
    if (!supabase) return false;
    try {
      const { error } = await supabase
        .from('items')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('❌ Error deleting item:', error);
      return false;
    }
  },

  // ---- TICKETS ----
  async getTickets() {
    const supabase = getSupabaseClient();
    if (!supabase) return [];
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('❌ Error getting tickets:', error);
      return [];
    }
  },

  async getTicket(id) {
    const supabase = getSupabaseClient();
    if (!supabase) return null;
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Error getting ticket:', error);
      return null;
    }
  },

  async addTicket(ticket) {
    const supabase = getSupabaseClient();
    if (!supabase) return null;
    try {
      const { data, error } = await supabase
        .from('tickets')
        .insert([{
          title: ticket.title,
          priority: ticket.priority || 'normal',
          status: ticket.status || 'baru',
          reporter: ticket.reporter || 'Anonim',
          description: ticket.desc || '-'
        }])
        .select();
      if (error) throw error;
      return data ? data[0] : null;
    } catch (error) {
      console.error('❌ Error adding ticket:', error);
      return null;
    }
  },

  async updateTicket(id, updates) {
    const supabase = getSupabaseClient();
    if (!supabase) return null;
    try {
      const { data, error } = await supabase
        .from('tickets')
        .update(updates)
        .eq('id', id)
        .select();
      if (error) throw error;
      return data ? data[0] : null;
    } catch (error) {
      console.error('❌ Error updating ticket:', error);
      return null;
    }
  },

  async deleteTicket(id) {
    const supabase = getSupabaseClient();
    if (!supabase) return false;
    try {
      const { error } = await supabase
        .from('tickets')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('❌ Error deleting ticket:', error);
      return false;
    }
  },

  // ---- TRANSACTIONS ----
  async getTransactions(limit = 50) {
    const supabase = getSupabaseClient();
    if (!supabase) return [];
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('id', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('❌ Error getting transactions:', error);
      return [];
    }
  },

  async addTransaction(tx) {
    const supabase = getSupabaseClient();
    if (!supabase) return null;
    try {
      const { data, error } = await supabase
        .from('transactions')
        .insert([{
          items: tx.items || [],
          total: tx.total || 0,
          donation: tx.donation || 0
        }])
        .select();
      if (error) throw error;
      return data ? data[0] : null;
    } catch (error) {
      console.error('❌ Error adding transaction:', error);
      return null;
    }
  },

  // ---- LEDGER ----
  async getLedger(limit = 50) {
    const supabase = getSupabaseClient();
    if (!supabase) return [];
    try {
      const { data, error } = await supabase
        .from('ledger')
        .select('*')
        .order('id', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('❌ Error getting ledger:', error);
      return [];
    }
  },

  async addLedgerBlock(block) {
    const supabase = getSupabaseClient();
    if (!supabase) return null;
    try {
      const { data, error } = await supabase
        .from('ledger')
        .insert([{
          index: block.index || 1,
          data: block.data || '',
          prev_hash: block.prevHash || '',
          hash: block.hash || ''
        }])
        .select();
      if (error) throw error;
      return data ? data[0] : null;
    } catch (error) {
      console.error('❌ Error adding ledger block:', error);
      return null;
    }
  },

  // ---- MESH NODES ----
  async getMeshNodes() {
    const supabase = getSupabaseClient();
    if (!supabase) return [];
    try {
      const { data, error } = await supabase
        .from('mesh_nodes')
        .select('*');
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('❌ Error getting mesh nodes:', error);
      return [];
    }
  },

  async updateMeshNode(id, updates) {
    const supabase = getSupabaseClient();
    if (!supabase) return null;
    try {
      const { data, error } = await supabase
        .from('mesh_nodes')
        .update({ ...updates, updated_at: new Date() })
        .eq('id', id)
        .select();
      if (error) throw error;
      return data ? data[0] : null;
    } catch (error) {
      console.error('❌ Error updating mesh node:', error);
      return null;
    }
  },

  async addMeshNode(node) {
    const supabase = getSupabaseClient();
    if (!supabase) return null;
    try {
      const { data, error } = await supabase
        .from('mesh_nodes')
        .insert([node])
        .select();
      if (error) throw error;
      return data ? data[0] : null;
    } catch (error) {
      console.error('❌ Error adding mesh node:', error);
      return null;
    }
  },

  // ---- FUNDS ----
  async getFunds() {
    const supabase = getSupabaseClient();
    if (!supabase) return null;
    try {
      const { data, error } = await supabase
        .from('funds')
        .select('*')
        .order('id', { ascending: false })
        .limit(1);
      if (error) throw error;
      return data && data.length > 0 ? data[0] : null;
    } catch (error) {
      console.error('❌ Error getting funds:', error);
      return null;
    }
  },

  async updateFunds(updates) {
    const supabase = getSupabaseClient();
    if (!supabase) return null;
    try {
      // Get current funds first
      const current = await this.getFunds();
      if (!current) {
        // Insert new if not exists
        const { data, error } = await supabase
          .from('funds')
          .insert([{
            balance: updates.balance || 0,
            retail: updates.retail || 0,
            donation: updates.donation || 0,
            csr: updates.csr || 0
          }])
          .select();
        if (error) throw error;
        return data ? data[0] : null;
      }

      const { data, error } = await supabase
        .from('funds')
        .update({
          balance: updates.balance !== undefined ? updates.balance : current.balance,
          retail: updates.retail !== undefined ? updates.retail : current.retail,
          donation: updates.donation !== undefined ? updates.donation : current.donation,
          csr: updates.csr !== undefined ? updates.csr : current.csr,
          updated_at: new Date()
        })
        .eq('id', current.id)
        .select();
      if (error) throw error;
      return data ? data[0] : null;
    } catch (error) {
      console.error('❌ Error updating funds:', error);
      return null;
    }
  },

  // ---- USERS ----
  async getUsers() {
    const supabase = getSupabaseClient();
    if (!supabase) return [];
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('❌ Error getting users:', error);
      return [];
    }
  },

  async addUser(user) {
    const supabase = getSupabaseClient();
    if (!supabase) return null;
    try {
      const { data, error } = await supabase
        .from('users')
        .insert([user])
        .select();
      if (error) throw error;
      return data ? data[0] : null;
    } catch (error) {
      console.error('❌ Error adding user:', error);
      return null;
    }
  },

  // ---- REALTIME SUBSCRIPTIONS ----
  subscribeToTable(table, callback) {
    const supabase = getSupabaseClient();
    if (!supabase) return null;

    const channel = supabase
      .channel(`${table}-changes`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: table },
        (payload) => {
          console.log(`🔄 ${table} changed:`, payload);
          if (callback) callback(payload);
        }
      )
      .subscribe((status) => {
        console.log(`📡 ${table} subscription status:`, status);
      });

    return channel;
  },

  // ---- AUTH ----
  async signUp(email, password, metadata = {}) {
    const supabase = getSupabaseClient();
    if (!supabase) return null;
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          data: metadata
        }
      });
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Error signing up:', error);
      return null;
    }
  },

  async signIn(email, password) {
    const supabase = getSupabaseClient();
    if (!supabase) return null;
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password
      });
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Error signing in:', error);
      return null;
    }
  },

  async signOut() {
    const supabase = getSupabaseClient();
    if (!supabase) return false;
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('❌ Error signing out:', error);
      return false;
    }
  },

  async getCurrentUser() {
    const supabase = getSupabaseClient();
    if (!supabase) return null;
    try {
      const { data, error } = await supabase.auth.getUser();
      if (error) throw error;
      return data.user;
    } catch (error) {
      console.error('❌ Error getting current user:', error);
      return null;
    }
  }
};

// Export untuk digunakan
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SupaDB, getSupabaseClient, SUPABASE_CONFIG };
}

console.log('📦 Supabase wrapper loaded');
