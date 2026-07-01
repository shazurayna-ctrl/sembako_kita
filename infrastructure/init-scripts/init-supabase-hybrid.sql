-- ============================================
-- INIT-SUPABASE-HYBRID.SQL — SembakoKita.Pro
-- ============================================
-- Tugas:
-- 1. Setup database schema untuk Supabase hybrid
-- 2. Buat semua tabel (users, items, transactions, dll)
-- 3. Buat trigger & function
-- 4. Enable RLS (Row Level Security)
-- 5. Seed data awal
-- ============================================

-- ============================================
-- EXTENSIONS
-- ============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";

-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) UNIQUE,
    full_name VARCHAR(255),
    nik VARCHAR(16) UNIQUE,
    role VARCHAR(50) DEFAULT 'warga',
    status VARCHAR(50) DEFAULT 'active',
    trust_score INTEGER DEFAULT 0,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE,
    verified BOOLEAN DEFAULT FALSE,
    device_id VARCHAR(255),
    fcm_token TEXT
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_nik ON users(nik);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);

-- ============================================
-- ITEMS TABLE (Barang Sembako)
-- ============================================
CREATE TABLE items (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    emoji VARCHAR(10),
    stock INTEGER DEFAULT 0,
    min_stock INTEGER DEFAULT 0,
    unit VARCHAR(20) DEFAULT 'kg',
    modal INTEGER NOT NULL,
    het INTEGER NOT NULL,
    status VARCHAR(50) DEFAULT 'Aman',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

CREATE INDEX idx_items_category ON items(category);
CREATE INDEX idx_items_status ON items(status);
CREATE INDEX idx_items_het ON items(het);

-- ============================================
-- TRANSACTIONS TABLE (Kasir Retail)
-- ============================================
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    items JSONB NOT NULL,
    subtotal INTEGER NOT NULL,
    donation INTEGER DEFAULT 0,
    total INTEGER NOT NULL,
    payment_method VARCHAR(50) DEFAULT 'cash',
    status VARCHAR(50) DEFAULT 'completed',
    merchant_id UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_merchant_id ON transactions(merchant_id);
CREATE INDEX idx_transactions_created_at ON transactions(created_at);

-- ============================================
-- REPORTS TABLE (Laporan Warga)
-- ============================================
CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    priority VARCHAR(50) DEFAULT 'normal',
    status VARCHAR(50) DEFAULT 'pending',
    location VARCHAR(255),
    lat DECIMAL(10,8),
    lng DECIMAL(11,8),
    images TEXT[],
    assigned_to UUID REFERENCES users(id),
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_reports_user_id ON reports(user_id);
CREATE INDEX idx_reports_priority ON reports(priority);
CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_reports_created_at ON reports(created_at);
CREATE INDEX idx_reports_location ON reports(lat, lng);

-- ============================================
-- BARTER TABLE
-- ============================================
CREATE TABLE barter (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    from_user_id UUID REFERENCES users(id),
    to_user_id UUID REFERENCES users(id),
    from_items JSONB NOT NULL,
    to_items JSONB NOT NULL,
    ratio DECIMAL(10,2) NOT NULL,
    trust_score INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    verified_by UUID REFERENCES users(id)
);

CREATE INDEX idx_barter_from_user ON barter(from_user_id);
CREATE INDEX idx_barter_to_user ON barter(to_user_id);
CREATE INDEX idx_barter_status ON barter(status);

-- ============================================
-- MESH_NODES TABLE
-- ============================================
CREATE TABLE mesh_nodes (
    id VARCHAR(50) PRIMARY KEY,
    device VARCHAR(100),
    owner VARCHAR(255),
    signal INTEGER,
    last_seen TIMESTAMP WITH TIME ZONE,
    data_tx INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'inactive',
    ip_address INET,
    mac_address VARCHAR(17),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_mesh_nodes_status ON mesh_nodes(status);
CREATE INDEX idx_mesh_nodes_last_seen ON mesh_nodes(last_seen);

-- ============================================
-- LEDGER TABLE (Blockchain)
-- ============================================
CREATE TABLE ledger (
    id SERIAL PRIMARY KEY,
    index INTEGER NOT NULL,
    data TEXT NOT NULL,
    prev_hash VARCHAR(64) NOT NULL,
    hash VARCHAR(64) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_ledger_index ON ledger(index);

-- ============================================
-- SOS_EMERGENCY TABLE
-- ============================================
CREATE TABLE sos_emergency (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    lat DECIMAL(10,8),
    lng DECIMAL(11,8),
    message TEXT,
    radius DECIMAL(4,2) DEFAULT 2.4,
    status VARCHAR(50) DEFAULT 'active',
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_sos_user_id ON sos_emergency(user_id);
CREATE INDEX idx_sos_status ON sos_emergency(status);
CREATE INDEX idx_sos_created_at ON sos_emergency(created_at);

-- ============================================
-- FUNDS TABLE (Pendanaan)
-- ============================================
CREATE TABLE funds (
    id SERIAL PRIMARY KEY,
    balance BIGINT DEFAULT 0,
    retail BIGINT DEFAULT 0,
    donation BIGINT DEFAULT 0,
    csr BIGINT DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE funding_sources (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    target_amount BIGINT,
    collected_amount BIGINT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- CHECKLIST TABLE
-- ============================================
CREATE TABLE checklist (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    type VARCHAR(50) DEFAULT 'target',
    priority VARCHAR(50) DEFAULT 'normal',
    status VARCHAR(50) DEFAULT 'pending',
    assigned_to UUID REFERENCES users(id),
    due_date TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_checklist_type ON checklist(type);
CREATE INDEX idx_checklist_status ON checklist(status);

-- ============================================
-- LOGISTICS TABLE
-- ============================================
CREATE TABLE logistics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    truck_id VARCHAR(50) NOT NULL,
    driver VARCHAR(255),
    items JSONB,
    route JSONB,
    status VARCHAR(50) DEFAULT 'planned',
    eta TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_logistics_status ON logistics(status);

-- ============================================
-- TRIGGERS & FUNCTIONS
-- ============================================

-- Update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_items_updated_at
    BEFORE UPDATE ON items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reports_updated_at
    BEFORE UPDATE ON reports
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_checklist_updated_at
    BEFORE UPDATE ON checklist
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE barter ENABLE ROW LEVEL SECURITY;
ALTER TABLE mesh_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE sos_emergency ENABLE ROW LEVEL SECURITY;
ALTER TABLE funds ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist ENABLE ROW LEVEL SECURITY;
ALTER TABLE logistics ENABLE ROW LEVEL SECURITY;

-- Policies: Users can read their own data
CREATE POLICY users_select_policy ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY users_update_policy ON users FOR UPDATE USING (auth.uid() = id);

-- Policies: Public read for items
CREATE POLICY items_select_policy ON items FOR SELECT TO PUBLIC USING (true);
CREATE POLICY items_update_policy ON items FOR UPDATE USING (auth.role() = 'admin');

-- Policies: Reports can be read by all, inserted by all
CREATE POLICY reports_select_policy ON reports FOR SELECT TO PUBLIC USING (true);
CREATE POLICY reports_insert_policy ON reports FOR INSERT TO PUBLIC WITH CHECK (true);
CREATE POLICY reports_update_policy ON reports FOR UPDATE USING (auth.uid() = user_id OR auth.role() = 'admin');

-- ============================================
-- SEED DATA
-- ============================================

-- Users (Admin & Warga)
INSERT INTO users (email, full_name, role, verified) VALUES 
('admin@sembakokita.pro', 'Admin Posko', 'admin', TRUE),
('budiono@sembakokita.pro', 'Budiono', 'warga', TRUE),
('siti@sembakokita.pro', 'Siti Rahayu', 'warga', TRUE);

-- Items (Sembako)
INSERT INTO items (name, category, emoji, stock, min_stock, unit, modal, het, status) VALUES 
('Beras SPHP', 'sembako', '🍚', 446, 100, 'kg', 10800, 12500, 'Aman'),
('Minyakita', 'sembako', '🫗', 277, 80, 'liter', 13500, 15700, 'Aman'),
('Telur Cikarang', 'sembako', '🥚', 117, 50, 'kg', 24000, 27500, 'Aman'),
('Gula Pasir', 'sembako', '🍬', 198, 60, 'kg', 12000, 14500, 'Aman'),
('Garam Bungkus', 'sembako', '🧂', 347, 100, 'bungkus', 3500, 5000, 'Aman'),
('Teh Celup', 'sembako', '🍵', 178, 50, 'box', 6500, 8500, 'Aman'),
('Mie Instan', 'sembako', '🍜', 499, 150, 'pcs', 2800, 3500, 'Aman'),
('Susu Kental', 'sembako', '🥛', 90, 40, 'kaleng', 8500, 11000, 'Aman'),
('Air Mineral', 'minuman', '💧', 600, 200, 'botol', 2500, 4000, 'Aman');

-- Mesh Nodes
INSERT INTO mesh_nodes (id, device, owner, signal, last_seen, data_tx, status) VALUES 
('N001', 'Samsung A14', 'Posko Pusat', -35, NOW(), 142, 'active'),
('N002', 'Xiaomi Redmi 9', 'Pak Budi RW05', -52, NOW() - INTERVAL '2 minutes', 38, 'active'),
('N003', 'OPPO A5s', 'Warung Bu Min', -48, NOW(), 67, 'active'),
('N004', 'Samsung J2', 'Pak RT 07', -65, NOW() - INTERVAL '15 minutes', 12, 'active');

-- Funds
INSERT INTO funds (balance, retail, donation, csr) VALUES (24743020, 8486800, 3100000, 15000000);

-- ============================================
-- VIEWS
-- ============================================

-- Dashboard Stats View
CREATE VIEW dashboard_stats AS
SELECT 
    (SELECT COUNT(*) FROM users) AS total_users,
    (SELECT COUNT(*) FROM items) AS total_items,
    (SELECT SUM(stock) FROM items) AS total_stock,
    (SELECT COUNT(*) FROM reports WHERE priority = 'darurat' AND status != 'resolved') AS emergency_reports,
    (SELECT COUNT(*) FROM mesh_nodes WHERE status = 'active') AS active_nodes,
    (SELECT balance FROM funds ORDER BY id DESC LIMIT 1) AS balance;

-- Daily Reports View
CREATE VIEW daily_reports AS
SELECT 
    DATE(created_at) AS date,
    COUNT(*) AS total,
    COUNT(CASE WHEN priority = 'darurat' THEN 1 END) AS emergency,
    COUNT(CASE WHEN priority = 'normal' THEN 1 END) AS normal,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) AS pending,
    COUNT(CASE WHEN status = 'resolved' THEN 1 END) AS resolved
FROM reports
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- ============================================
-- NOTIFY CHANGES (Realtime)
-- ============================================
CREATE OR REPLACE FUNCTION notify_changes()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM pg_notify('table_changes', json_build_object(
        'table', TG_TABLE_NAME,
        'action', TG_OP,
        'id', NEW.id,
        'timestamp', NOW()
    )::text);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER notify_items_changes
    AFTER INSERT OR UPDATE OR DELETE ON items
    FOR EACH ROW EXECUTE FUNCTION notify_changes();

CREATE TRIGGER notify_reports_changes
    AFTER INSERT OR UPDATE OR DELETE ON reports
    FOR EACH ROW EXECUTE FUNCTION notify_changes();

CREATE TRIGGER notify_transactions_changes
    AFTER INSERT OR UPDATE OR DELETE ON transactions
    FOR EACH ROW EXECUTE FUNCTION notify_changes();

-- ============================================
-- INDEXING FOR PERFORMANCE
-- ============================================
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reports_priority_status ON reports(priority, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_user_date ON transactions(user_id, created_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_items_category_status ON items(category, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_barter_status_date ON barter(status, created_at);

-- ============================================
-- VECTOR SEARCH (PGVECTOR)
-- ============================================
CREATE TABLE report_embeddings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_id UUID REFERENCES reports(id),
    embedding vector(1536),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_report_embeddings ON report_embeddings 
    USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100);

-- ============================================
-- DONE!
-- ============================================
COMMENT ON DATABASE sembakokita IS 'SembakoKita.Pro — Ekosistem Krisis Pangan';
COMMENT ON TABLE users IS 'Data pengguna (warga, pedagang, admin)';
COMMENT ON TABLE items IS 'Data barang sembako dengan HET';
COMMENT ON TABLE transactions IS 'Transaksi retail dengan donasi 15%';
COMMENT ON TABLE reports IS 'Laporan warga dengan prioritas';
COMMENT ON TABLE barter IS 'Transaksi barter antar warga';
COMMENT ON TABLE mesh_nodes IS 'Node mesh network BLE';
COMMENT ON TABLE ledger IS 'Blockchain lokal anti-edit';
COMMENT ON TABLE sos_emergency IS 'Laporan darurat SOS';
COMMENT ON TABLE funds IS 'Pendanaan & alokasi dana';

SELECT '✅ Database SembakoKita.Pro initialized successfully!' AS message;
