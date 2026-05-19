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

CREATE INDEX idx_organizations_parent_id ON organizations(parent_id);
CREATE INDEX idx_organizations_is_active ON organizations(is_active);

-- 9. UserOrganizations: จับคู่ผู้ใช้งานกับหน่วยงาน (1 คนอยู่หลายกรมได้)
CREATE TABLE user_organizations (
    user_id INTEGER NOT NULL,
    org_id INTEGER NOT NULL,
    PRIMARY KEY (user_id, org_id)
);

COMMENT ON TABLE user_organizations IS 'ตารางจับคู่ผู้ใช้งานกับหน่วยงาน (รองรับกรณี 1 คนสังกัดหลายกรม/สาขา)';
COMMENT ON COLUMN user_organizations.user_id IS 'ID ของผู้ใช้งาน';
COMMENT ON COLUMN user_organizations.org_id IS 'ID ของหน่วยงาน (สาขา/กรม)';

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
