-- Database Schema for DCCE RBAC System (No-FK Version)
-- Database: PostgreSQL
-- File: organizations.sql (Organization Structure & Boundaries)

-- 8. Organizations: โครงสร้างองค์กร (สาขา, กรม, กอง)
CREATE TABLE organizations (
    org_id SERIAL PRIMARY KEY,
    org_name VARCHAR(255) NOT NULL,
    parent_id INTEGER,
    sort_order INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    is_active INT2 DEFAULT 1,
    unit_data_permissions INTEGER,
    unit_view_climate_index SMALLINT,
    unit_view_ghg_emissions SMALLINT,
    unit_edit_historical_data SMALLINT,
    unit_approve_public_data SMALLINT,
    unit_remark TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE organizations IS 'ตารางเก็บโครงสร้างองค์กร (สาขา, กรม, กอง) แบบลำดับชั้น (Hierarchical)';
COMMENT ON COLUMN organizations.org_id IS 'รหัสหน่วยงาน';
COMMENT ON COLUMN organizations.org_name IS 'ชื่อหน่วยงาน (เช่น สาขาระยอง, กรม C)';
COMMENT ON COLUMN organizations.parent_id IS 'ID ของหน่วยงานที่เป็นแม่ข่าย (เช่น กรม C มี parent_id ชี้ไปที่ สาขาระยอง)';
COMMENT ON COLUMN organizations.sort_order IS 'ลำดับการแสดงผลของหน่วยงานหรือสาขาในระบบหน้าจอ';
COMMENT ON COLUMN organizations.level IS 'ระดับความลึกของหน่วยงาน (1 = สาขาหลัก, 2 = กอง/กรมย่อย, 3 = ฝ่าย/กลุ่มงานย่อย ฯลฯ)';
COMMENT ON COLUMN organizations.is_active IS 'สถานะการใช้งาน (1 = เปิดใช้งานปกติ, 0 = ถูกลบ/ปิดใช้งาน)';
COMMENT ON COLUMN organizations.unit_data_permissions IS 'ระดับการเข้าถึงข้อมูลของหน่วยงานย่อย (1=เข้าถึงเฉพาะข้อมูลของหน่วยงานตนเอง, 2=เข้าถึงข้อมูลระดับกรม/กระทรวง, 3=เข้าถึงข้อมูลระดับประเทศ)';
COMMENT ON COLUMN organizations.unit_view_climate_index IS 'ดูข้อมูลดัชนีภูมิอากาศ (0=เลือก, 1=ไม่เลือก)';
COMMENT ON COLUMN organizations.unit_view_ghg_emissions IS 'ดูข้อมูลการปล่อยก๊าซเรือนกระจก (0=เลือก, 1=ไม่เลือก)';
COMMENT ON COLUMN organizations.unit_edit_historical_data IS 'แก้ไขข้อมูลย้อนหลัง (0=เลือก, 1=ไม่เลือก)';
COMMENT ON COLUMN organizations.unit_approve_public_data IS 'อนุมัติการเผยแพร่ข้อมูลสาธารณะ (0=เลือก, 1=ไม่เลือก)';
COMMENT ON COLUMN organizations.unit_remark IS 'หมายเหตุของหน่วยงานย่อย (ถ้ามี)';

CREATE INDEX idx_organizations_parent_id ON organizations(parent_id);
CREATE INDEX idx_organizations_is_active ON organizations(is_active);

-- 9. UserOrganizations: จับคู่ผู้ใช้งานกับหน่วยงาน (1 คนอยู่หลายกรมได้)
CREATE TABLE user_organizations (
    user_id INTEGER NOT NULL,
    org_id INTEGER NOT NULL,
    is_primary SMALLINT DEFAULT 0,
    PRIMARY KEY (user_id, org_id)
);

COMMENT ON TABLE user_organizations IS 'ตารางจับคู่ผู้ใช้งานกับหน่วยงาน (รองรับกรณี 1 คนสังกัดหลายกรม/สาขา)';
COMMENT ON COLUMN user_organizations.user_id IS 'ID ของผู้ใช้งาน';
COMMENT ON COLUMN user_organizations.org_id IS 'ID ของหน่วยงาน (สาขา/กรม)';
COMMENT ON COLUMN user_organizations.is_primary IS 'สถานะสังกัดหลัก (1 = สังกัดหลัก, 0 = สิทธิ์เข้าถึงเพิ่มเติม)';

CREATE INDEX idx_user_organizations_is_primary ON user_organizations(is_primary);

-- ==========================================
-- 📂 MIGRATION & ALTER COMMANDS (คำสั่งปรับปรุงโครงสร้างตารางเดิม)
-- วันที่ดำเนินการ: 19 พฤษภาคม 2569 (19 May 2026)
-- ==========================================
-- หากคุณมีตาราง organizations อยู่แล้วในฐานข้อมูลหลัก ให้รันคำสั่ง SQL เหล่านี้เพื่ออัปเดตโครงสร้าง:
--
-- ALTER TABLE organizations ADD COLUMN sort_order INTEGER DEFAULT 0;
-- COMMENT ON COLUMN organizations.sort_order IS 'ลำดับการแสดงผลของหน่วยงานหรือสาขาในระบบหน้าจอ';
--
-- ALTER TABLE organizations ADD COLUMN level INTEGER DEFAULT 1;
-- COMMENT ON COLUMN organizations.level IS 'ระดับความลึกของหน่วยงาน (1 = สาขาหลัก, 2 = กอง/กรมย่อย, 3 = ฝ่าย/กลุ่มงานย่อย ฯลฯ)';
--
-- ALTER TABLE organizations ADD COLUMN is_active INT2 DEFAULT 1;
-- COMMENT ON COLUMN organizations.is_active IS 'สถานะการใช้งาน (1 = เปิดใช้งานปกติ, 0 = ถูกลบ/ปิดใช้งาน)';
--
-- CREATE INDEX idx_organizations_is_active ON organizations(is_active);

--
-- วันที่ดำเนินการ: 21 พฤษภาคม 2569 (21 May 2026) - เพิ่มฟิลด์สิทธิ์ Level 2
-- ALTER TABLE organizations ADD COLUMN unit_data_permissions INTEGER;
-- ALTER TABLE organizations ADD COLUMN unit_view_climate_index SMALLINT;
-- ALTER TABLE organizations ADD COLUMN unit_view_ghg_emissions SMALLINT;
-- ALTER TABLE organizations ADD COLUMN unit_edit_historical_data SMALLINT;
-- ALTER TABLE organizations ADD COLUMN unit_approve_public_data SMALLINT;
-- ALTER TABLE organizations ADD COLUMN unit_remark TEXT;
--
-- กรณีต้องการเอา DEFAULT ออกจากตารางเดิมที่เคยรันไปแล้ว:
-- ALTER TABLE organizations ALTER COLUMN unit_data_permissions DROP DEFAULT;
-- ALTER TABLE organizations ALTER COLUMN unit_view_climate_index DROP DEFAULT;
-- ALTER TABLE organizations ALTER COLUMN unit_view_ghg_emissions DROP DEFAULT;
-- ALTER TABLE organizations ALTER COLUMN unit_edit_historical_data DROP DEFAULT;
-- ALTER TABLE organizations ALTER COLUMN unit_approve_public_data DROP DEFAULT;
--
-- กรณีต้องการล้างค่าข้อมูลเก่าให้เป็น NULL (สำหรับทุกหน่วยงานที่เป็น level = 2):
-- UPDATE organizations SET 
--   unit_data_permissions = NULL,
--   unit_view_climate_index = NULL,
--   unit_view_ghg_emissions = NULL,
--   unit_edit_historical_data = NULL,
--   unit_approve_public_data = NULL
-- WHERE level = 2;
--
-- COMMENT ON COLUMN organizations.unit_data_permissions IS 'ระดับการเข้าถึงข้อมูลของหน่วยงานย่อย (1=เข้าถึงเฉพาะข้อมูลของหน่วยงานตนเอง, 2=เข้าถึงข้อมูลระดับกรม/กระทรวง, 3=เข้าถึงข้อมูลระดับประเทศ)';
-- COMMENT ON COLUMN organizations.unit_view_climate_index IS 'ดูข้อมูลดัชนีภูมิอากาศ (0=เลือก, 1=ไม่เลือก)';
-- COMMENT ON COLUMN organizations.unit_view_ghg_emissions IS 'ดูข้อมูลการปล่อยก๊าซเรือนกระจก (0=เลือก, 1=ไม่เลือก)';
-- COMMENT ON COLUMN organizations.unit_edit_historical_data IS 'แก้ไขข้อมูลย้อนหลัง (0=เลือก, 1=ไม่เลือก)';
-- COMMENT ON COLUMN organizations.unit_approve_public_data IS 'อนุมัติการเผยแพร่ข้อมูลสาธารณะ (0=เลือก, 1=ไม่เลือก)';
-- COMMENT ON COLUMN organizations.unit_remark IS 'หมายเหตุของหน่วยงานย่อย (ถ้ามี)';

--
-- วันที่ดำเนินการ: 22 พฤษภาคม 2569 (22 May 2026) - เพิ่ม is_primary ใน user_organizations
-- ALTER TABLE user_organizations ADD COLUMN is_primary SMALLINT DEFAULT 0;
-- COMMENT ON COLUMN user_organizations.is_primary IS 'สถานะสังกัดหลัก (1 = สังกัดหลัก, 0 = สิทธิ์เข้าถึงเพิ่มเติม)';
-- CREATE INDEX idx_user_organizations_is_primary ON user_organizations(is_primary);
--
-- อัปเดตข้อมูลเดิมที่มีอยู่ให้เป็นสังกัดหลักทั้งหมด (กรณีมีข้อมูลอยู่แล้ว):
-- UPDATE user_organizations SET is_primary = 1 WHERE is_primary = 0;

-- ==========================================
-- 10. Organization Permissions (กำหนดสิทธิ์ให้หน่วยงาน)
-- ==========================================
CREATE TABLE IF NOT EXISTS organization_permissions (
    org_id INTEGER NOT NULL,
    permission_id INTEGER NOT NULL,
    PRIMARY KEY (org_id, permission_id)
);

COMMENT ON TABLE organization_permissions IS 'ตารางจับคู่หน่วยงาน/สาขากับสิทธิ์การใช้งาน';
COMMENT ON COLUMN organization_permissions.org_id IS 'ID ของหน่วยงานหรือสาขา';
COMMENT ON COLUMN organization_permissions.permission_id IS 'ID ของสิทธิ์ย่อย';
-- ==========================================
-- 10. Organization Permissions (กำหนดสิทธิ์ให้หน่วยงาน)
-- ==========================================
CREATE TABLE IF NOT EXISTS organization_permissions (
    org_id INTEGER NOT NULL,
    permission_id INTEGER NOT NULL,
    PRIMARY KEY (org_id, permission_id)
);

COMMENT ON TABLE organization_permissions IS 'ตารางจับคู่หน่วยงาน/สาขากับสิทธิ์การใช้งาน (แทนที่ role_permissions สำหรับระบบนี้)';
COMMENT ON COLUMN organization_permissions.org_id IS 'ID ของหน่วยงานหรือสาขา';
COMMENT ON COLUMN organization_permissions.permission_id IS 'ID ของสิทธิ์ย่อย';
