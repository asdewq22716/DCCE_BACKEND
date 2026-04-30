-- Database Schema for DCCE RBAC System (No-FK Version)
-- Database: PostgreSQL

-- 1. Organizations: เก็บโครงสร้างองค์กร (กรม > กอง > ฝ่าย)
/* CREATE TABLE organizations (
    organization_id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    parent_id INTEGER,
    type VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE organizations IS 'เก็บโครงสร้างองค์กร (กรม > กอง > ฝ่าย)';
COMMENT ON COLUMN organizations.organization_id IS 'ID ลำดับที่ของหน่วยงาน';
COMMENT ON COLUMN organizations.name IS 'ชื่อหน่วยงาน/ส่วนงาน';
COMMENT ON COLUMN organizations.parent_id IS 'ID ของหน่วยงานต้นสังกัด (ใช้ทำลำดับชั้น Hierarchy)';
COMMENT ON COLUMN organizations.type IS 'ประเภทหน่วยงาน เช่น กรม, กอง, ฝ่าย';
 */
-- 2. Users: ข้อมูลผู้ใช้งานที่ Sync มาจาก SSO และข้อมูลท้องถิ่นในระบบ
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    
    -- SSO Fields
    sso_userid VARCHAR(100),
    sso_username VARCHAR(100),
    sso_token TEXT,
    sso_idcard_no VARCHAR(20),
    sso_email VARCHAR(255),
    sso_prefix_name VARCHAR(100),
    sso_firstname VARCHAR(100),
    sso_lastname VARCHAR(100),
    sso_work_position_text VARCHAR(255),
    sso_work_place_text VARCHAR(255),
    sso_work_place_id VARCHAR(100),
    sso_work_place_name VARCHAR(255),
    sso_work_place_type_id VARCHAR(100),
    sso_work_place_type_name VARCHAR(255),
    sso_division_id VARCHAR(100),
    sso_division_name VARCHAR(255),
    sso_sub_division_id VARCHAR(100),
    sso_sub_division_name VARCHAR(255),
    
    -- Local Data
    full_name VARCHAR(255),
    is_active SMALLINT DEFAULT 1,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE users IS 'ข้อมูลผู้ใช้งานที่ Sync มาจาก SSO และข้อมูลท้องถิ่นในระบบ';
COMMENT ON COLUMN users.user_id IS 'ID ลำดับที่ของผู้ใช้งานในระบบ';
COMMENT ON COLUMN users.sso_userid IS 'รหัส Unique ID จากระบบ SSO';
COMMENT ON COLUMN users.sso_username IS 'ชื่อผู้ใช้งาน (Username) จาก SSO';
COMMENT ON COLUMN users.sso_token IS 'Access Token ล่าสุดจาก SSO';
COMMENT ON COLUMN users.sso_idcard_no IS 'เลขบัตรประจำตัวประชาชน';
COMMENT ON COLUMN users.sso_email IS 'อีเมลผู้ใช้งาน';
COMMENT ON COLUMN users.sso_prefix_name IS 'คำนำหน้าชื่อ';
COMMENT ON COLUMN users.sso_firstname IS 'ชื่อจริง';
COMMENT ON COLUMN users.sso_lastname IS 'นามสกุล';
COMMENT ON COLUMN users.sso_work_position_text IS 'ชื่อตำแหน่งงาน (ข้อความ)';
COMMENT ON COLUMN users.sso_work_place_text IS 'ชื่อสถานที่ทำงาน (ข้อความรวม)';
COMMENT ON COLUMN users.sso_work_place_id IS 'รหัสสถานที่ทำงาน';
COMMENT ON COLUMN users.sso_work_place_name IS 'ชื่อสถานที่ทำงาน (กรม/สำนัก)';
COMMENT ON COLUMN users.sso_division_name IS 'ชื่อกอง/ส่วน';
COMMENT ON COLUMN users.sso_sub_division_name IS 'ชื่อฝ่าย/กลุ่มงาน';
COMMENT ON COLUMN users.full_name IS 'ชื่อ-นามสกุลเต็ม สำหรับแสดงผล';
COMMENT ON COLUMN users.is_active IS 'สถานะการเปิดใช้งานในระบบนี้ (1 = ปกติ, 0 = ระงับ)';
COMMENT ON COLUMN users.last_login IS 'วันเวลาที่เข้าสู่ระบบครั้งล่าสุด';

-- 3. Roles: ตำแหน่งหรือบทบาทการทำงาน
CREATE TABLE roles (
    role_id SERIAL PRIMARY KEY,
    role_name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE roles IS 'ตารางนิยามตำแหน่งหรือบทบาทการทำงาน (เช่น Admin, User)';
COMMENT ON COLUMN roles.role_name IS 'ชื่อบทบาท (ภาษาอังกฤษ เช่น ADMIN)';
COMMENT ON COLUMN roles.description IS 'รายละเอียดหน้าที่ของบทบาทนี้';

-- 5. UserRoles: จับคู่ผู้ใช้งานกับบทบาท
CREATE TABLE user_roles (
    user_id INTEGER NOT NULL,
    role_id INTEGER NOT NULL,
    PRIMARY KEY (user_id, role_id)
);

COMMENT ON TABLE user_roles IS 'ตารางจับคู่ผู้ใช้งานกับบทบาท';
COMMENT ON COLUMN user_roles.user_id IS 'ID ของผู้ใช้งาน';
COMMENT ON COLUMN user_roles.role_id IS 'ID ของบทบาท';
 
-- 4. PermissionGroups: กลุ่มของสิทธิ์
CREATE TABLE permission_groups (
    group_id SERIAL PRIMARY KEY,
    group_name VARCHAR(100) NOT NULL UNIQUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE permission_groups IS 'ตารางกลุ่มของสิทธิ์การใช้งาน';
COMMENT ON COLUMN permission_groups.group_name IS 'ชื่อกลุ่มสิทธิ์ (เช่น ระบบสมาชิก, รายงาน)';
COMMENT ON COLUMN permission_groups.sort_order IS 'ลำดับการแสดงผลของกลุ่มสิทธิ์';

-- 4. Permissions: นิยามสิทธิ์การเข้าถึงเมนูหรือฟังก์ชัน
CREATE TABLE permissions (
    permission_id SERIAL PRIMARY KEY,
    p_key VARCHAR(100) NOT NULL UNIQUE,
    p_label VARCHAR(255),
    group_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE permissions IS 'ตารางนิยามสิทธิ์การเข้าถึงเมนูหรือฟังก์ชัน (กุญแจสิทธิ์)';
COMMENT ON COLUMN permissions.p_key IS 'รหัสสิทธิ์ (เช่น user.view)';
COMMENT ON COLUMN permissions.p_label IS 'ชื่อเรียกสิทธิ์ที่เข้าใจง่าย';
COMMENT ON COLUMN permissions.group_id IS 'ID ของกลุ่มสิทธิ์ (เชื่อมโยง permission_groups)';

-- 6. RolePermissions: จับคู่บทบาทกับสิทธิ์
CREATE TABLE role_permissions (
    role_id INTEGER NOT NULL,
    permission_id INTEGER NOT NULL,
    PRIMARY KEY (role_id, permission_id)
);

COMMENT ON TABLE role_permissions IS 'ตารางจับคู่บทบาทกับสิทธิ์';
COMMENT ON COLUMN role_permissions.role_id IS 'ID ของบทบาท';
COMMENT ON COLUMN role_permissions.permission_id IS 'ID ของสิทธิ์';

-- 7. UserPermissions: สิทธิ์พิเศษรายบุคคล
CREATE TABLE user_permissions (
    user_permissions_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    permission_id INTEGER NOT NULL,
    is_deny BOOLEAN DEFAULT FALSE,
    expired_at TIMESTAMP,
    remark TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_user_permission UNIQUE (user_id, permission_id)
);

COMMENT ON TABLE user_permissions IS 'ตารางให้สิทธิ์พิเศษเฉพาะรายบุคคล';
COMMENT ON COLUMN user_permissions.user_id IS 'ID ของผู้ใช้งาน';
COMMENT ON COLUMN user_permissions.permission_id IS 'ID ของสิทธิ์ที่ได้รับเพิ่ม';
COMMENT ON COLUMN user_permissions.is_deny IS 'สถานะสั่งห้าม (True = ห้ามเข้าถึงแม้ Role จะอนุญาต)';
COMMENT ON COLUMN user_permissions.expired_at IS 'วันหมดอายุของสิทธิ์พิเศษ';
COMMENT ON COLUMN user_permissions.remark IS 'หมายเหตุการให้สิทธิ์';

-- Indexes
CREATE INDEX idx_users_sso_userid ON users(sso_userid);
CREATE INDEX idx_organizations_parent_id ON organizations(parent_id);
