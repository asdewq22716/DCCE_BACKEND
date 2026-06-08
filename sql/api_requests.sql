-- ==========================================
-- 1. Table: api_objectives (วัตถุประสงค์การใช้งาน API)
-- ==========================================
CREATE TABLE IF NOT EXISTS api_objectives (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  is_active SMALLINT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER,
  updated_by INTEGER
);

COMMENT ON TABLE api_objectives IS 'ตารางเก็บข้อมูลตัวเลือก วัตถุประสงค์การใช้งาน API';
COMMENT ON COLUMN api_objectives.name IS 'ชื่อวัตถุประสงค์';
COMMENT ON COLUMN api_objectives.is_active IS 'สถานะ 1=ใช้งาน, 0=ไม่ใช้งาน';

-- ==========================================
-- 2. Table: server_ips (IP Address ของ Server)
-- ==========================================
CREATE TABLE IF NOT EXISTS server_ips (
  id SERIAL PRIMARY KEY,
  ip_address VARCHAR(50) NOT NULL,
  is_active SMALLINT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER,
  updated_by INTEGER
);

COMMENT ON TABLE server_ips IS 'ตารางเก็บข้อมูลตัวเลือก IP Address สำหรับ API';
COMMENT ON COLUMN server_ips.ip_address IS 'หมายเลข IP Address (เช่น 10.10.10.10)';
COMMENT ON COLUMN server_ips.is_active IS 'สถานะ 1=ใช้งาน, 0=ไม่ใช้งาน';

-- ==========================================
-- 3. Table: api_requests (คำขอใช้งาน API)
-- ==========================================
CREATE TABLE IF NOT EXISTS api_requests (
  id SERIAL PRIMARY KEY,
  request_id VARCHAR(50) NOT NULL,
  branch_id INTEGER NOT NULL,
  division_id INTEGER NOT NULL,
  app_url VARCHAR(255),
  sys_web_app SMALLINT DEFAULT 0,
  sys_mobile_app SMALLINT DEFAULT 0,
  sys_server_to_server SMALLINT DEFAULT 0,
  objective_text VARCHAR(500),
  api_climate_data SMALLINT DEFAULT 0,
  api_station_data SMALLINT DEFAULT 0,
  api_statistics_report SMALLINT DEFAULT 0,
  api_climate_map SMALLINT DEFAULT 0,
  server_ip_id INTEGER,
  callback_url VARCHAR(255),
  environment VARCHAR(50),
  comment TEXT,
  status VARCHAR(50) DEFAULT 'pending',
  is_active SMALLINT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER,
  updated_by INTEGER
);

COMMENT ON TABLE api_requests IS 'ตารางเก็บข้อมูลแบบฟอร์มคำขอใช้งาน API';
COMMENT ON COLUMN api_requests.request_id IS 'รหัสคำขออัตโนมัติ (เช่น API-2026-001)';
COMMENT ON COLUMN api_requests.branch_id IS 'ID ของสาขา (อ้างอิง organizations.org_id)';
COMMENT ON COLUMN api_requests.division_id IS 'ID ของหน่วยงาน (อ้างอิง organizations.org_id)';
COMMENT ON COLUMN api_requests.app_url IS 'URL ของระบบ';
COMMENT ON COLUMN api_requests.sys_web_app IS 'ประเภทระบบ: Web Application (1=เลือก, 0=ไม่เลือก)';
COMMENT ON COLUMN api_requests.sys_mobile_app IS 'ประเภทระบบ: Mobile Application (1=เลือก, 0=ไม่เลือก)';
COMMENT ON COLUMN api_requests.sys_server_to_server IS 'ประเภทระบบ: Server-to-Server (1=เลือก, 0=ไม่เลือก)';
COMMENT ON COLUMN api_requests.objective_text IS 'วัตถุประสงค์การใช้งาน (ข้อความอิสระ)';
COMMENT ON COLUMN api_requests.api_climate_data IS 'รายการ API: ข้อมูลสภาพภูมิอากาศ (1=เลือก, 0=ไม่เลือก)';
COMMENT ON COLUMN api_requests.api_station_data IS 'รายการ API: ข้อมูลสถานีตรวจวัด (1=เลือก, 0=ไม่เลือก)';
COMMENT ON COLUMN api_requests.api_statistics_report IS 'รายการ API: ข้อมูลรายงานสถิติ (1=เลือก, 0=ไม่เลือก)';
COMMENT ON COLUMN api_requests.api_climate_map IS 'รายการ API: ข้อมูลแผนที่ภูมิอากาศ (1=เลือก, 0=ไม่เลือก)';
COMMENT ON COLUMN api_requests.server_ip_id IS 'ID อ้างอิงตาราง server_ips';
COMMENT ON COLUMN api_requests.callback_url IS 'Callback / Redirect URL';
COMMENT ON COLUMN api_requests.environment IS 'Environment (Sandbox, Production)';
COMMENT ON COLUMN api_requests.comment IS 'ความคิดเห็น / หมายเหตุเพิ่มเติม';
COMMENT ON COLUMN api_requests.status IS 'สถานะคำขอ (pending, approved, rejected)';
COMMENT ON COLUMN api_requests.is_active IS 'สถานะ 1=ใช้งาน, 0=ลบ (Soft Delete)';

-- ==========================================
-- 📂 MIGRATION & ALTER COMMANDS
-- วันที่ดำเนินการ: 5 มิถุนายน 2569 (5 June 2026)
-- ==========================================
-- ALTER TABLE api_requests DROP COLUMN app_name;
-- ALTER TABLE api_requests ADD COLUMN branch_id INTEGER NOT NULL DEFAULT 0;
-- ALTER TABLE api_requests ADD COLUMN division_id INTEGER NOT NULL DEFAULT 0;
-- COMMENT ON COLUMN api_requests.branch_id IS 'ID ของสาขา (อ้างอิง organizations.org_id)';
-- COMMENT ON COLUMN api_requests.division_id IS 'ID ของหน่วยงาน (อ้างอิง organizations.org_id)';

-- ==========================================
-- 📂 MIGRATION
-- วันที่ดำเนินการ: 8 มิถุนายน 2569 (8 June 2026)
-- เปลี่ยน objective_id จาก INTEGER (FK → api_objectives) เป็น VARCHAR (text อิสระ)
-- ==========================================
-- ALTER TABLE api_requests ALTER COLUMN objective_id TYPE VARCHAR(500) USING objective_id::VARCHAR;
-- ALTER TABLE api_requests RENAME COLUMN objective_id TO objective_text;
-- COMMENT ON COLUMN api_requests.objective_text IS 'วัตถุประสงค์การใช้งาน (ข้อความอิสระ ไม่อ้างอิง api_objectives แล้ว)';

-- ==========================================
-- 📂 MIGRATION
-- วันที่ดำเนินการ: 8 มิถุนายน 2569 (8 June 2026) #2
-- เพิ่ม column comment (ความคิดเห็น / หมายเหตุ)
-- ==========================================
-- ALTER TABLE api_requests ADD COLUMN comment TEXT;
-- COMMENT ON COLUMN api_requests.comment IS 'ความคิดเห็น / หมายเหตุเพิ่มเติม';
