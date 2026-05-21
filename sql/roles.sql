-- ====================================================================
-- Database Schema for Roles & Role-Permissions System (DCCE Project)
-- Database: PostgreSQL
-- File: sql/roles.sql
-- Description: ตารางกำหนดบทบาท (Roles), สิทธิ์การเข้าถึง (Permissions) และข้อมูลประวัติ
-- ====================================================================

-- --------------------------------------------------------------------
-- 1. ตาราง Roles (บทบาท/ตำแหน่งหน้าที่)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS roles (
    role_id SERIAL PRIMARY KEY,
    role_name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    is_active SMALLINT DEFAULT 1, -- 1 = ปกติ, 0 = ถูกลบ (Soft Delete)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE roles IS 'ตารางนิยามตำแหน่งหรือบทบาทการทำงาน (เช่น ADMIN, STAFF)';
COMMENT ON COLUMN roles.role_id IS 'รหัส ID ของบทบาท';
COMMENT ON COLUMN roles.role_name IS 'ชื่อบทบาท (ภาษาอังกฤษตัวพิมพ์ใหญ่)';
COMMENT ON COLUMN roles.description IS 'รายละเอียดขอบเขตของบทบาท';
COMMENT ON COLUMN roles.is_active IS 'สถานะการใช้งาน (1 = ปกติ, 0 = ลบแบบ Soft Delete)';

-- --------------------------------------------------------------------
-- คำสั่งอัปเดตสำหรับระบบเดิม (ในกรณีที่สร้างตารางไปแล้วแต่ยังไม่มีคอลัมน์ is_active)
-- --------------------------------------------------------------------
-- ALTER TABLE roles ADD COLUMN IF NOT EXISTS is_active SMALLINT DEFAULT 1;
-- COMMENT ON COLUMN roles.is_active IS 'สถานะการใช้งาน (1 = ปกติ, 0 = ลบแบบ Soft Delete)';

-- --------------------------------------------------------------------
-- 2. ตาราง RolePermissions (จับคู่บทบาทกับสิทธิ์การใช้งาน)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS role_permissions (
    role_id INTEGER NOT NULL,
    permission_id INTEGER NOT NULL,
    PRIMARY KEY (role_id, permission_id)
);

COMMENT ON TABLE role_permissions IS 'ตารางจับคู่ระหว่างบทบาทกับสิทธิ์ย่อยการใช้งาน';
COMMENT ON COLUMN role_permissions.role_id IS 'ID ของบทบาท';
COMMENT ON COLUMN role_permissions.permission_id IS 'ID ของสิทธิ์ย่อย';


-- --------------------------------------------------------------------
-- 3. ตาราง UserRoles (จับคู่ผู้ใช้งานกับบทบาท)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_roles (
    user_id INTEGER NOT NULL,
    role_id INTEGER NOT NULL,
    PRIMARY KEY (user_id, role_id)
);

COMMENT ON TABLE user_roles IS 'ตารางจับคู่ผู้ใช้งานเข้ากับบทบาท';
COMMENT ON COLUMN user_roles.user_id IS 'ID ของผู้ใช้งานในระบบ';
COMMENT ON COLUMN user_roles.role_id IS 'ID ของบทบาท';


-- --------------------------------------------------------------------
-- 4. ข้อมูลเริ่มต้นสำหรับระบบ (Seed Data)
-- --------------------------------------------------------------------
-- ล้างข้อมูลตัวอย่างเดิมก่อนสร้างใหม่ (หากต้องการรันเพื่อเริ่มทดสอบระบบใหม่)
-- TRUNCATE TABLE roles RESTART IDENTITY CASCADE;

INSERT INTO roles (role_name, description, is_active) 
VALUES 
('ADMIN', 'ผู้ดูแลระบบสูงสุด สามารถเข้าถึงและจัดการได้ทุกเมนู', 1),
('EDITOR', 'ผู้บันทึก/แก้ไขข้อมูล สามารถบันทึกข้อมูลหน่วยงานและส่งออกข้อมูลได้', 1),
('VIEWER', 'ผู้เข้าชม/ดูรายงานทั่วไป สามารถเปิดดูข้อมูลและหน้า Dashboard ได้เท่านั้น', 1)
ON CONFLICT (role_name) DO UPDATE 
SET description = EXCLUDED.description, is_active = 1;
