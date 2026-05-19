-- ==========================================
-- 📂 CENTRAL AUDIT LOGS DATABASE TABLE
-- วันที่ดำเนินการ: 19 พฤษภาคม 2569 (19 May 2026)
-- ==========================================

CREATE TABLE audit_logs (
    log_id SERIAL PRIMARY KEY,
    action_type VARCHAR(50) NOT NULL,    -- ประเภทการกระทำ เช่น 'CREATE', 'UPDATE', 'DELETE'
    module_name VARCHAR(100) NOT NULL,   -- ชื่อโมดูล/ตารางที่ถูกแก้ไข เช่น 'organizations'
    record_id VARCHAR(100),              -- ID ของข้อมูลตัวที่ถูกแก้ไข (เช่น org_id ของสาขาหลัก)
    old_data JSONB,                      -- ข้อมูลเดิมก่อนแก้ไข (เก็บเป็น JSON เพื่อเปรียบเทียบข้อมูลย้อนหลัง)
    new_data JSONB,                      -- ข้อมูลใหม่หลังแก้ไข (เก็บเป็น JSON)
    remark TEXT,                         -- หมายเหตุ / เหตุผลการแก้ไขที่ส่งมาจากหน้าจอ
    ip_address VARCHAR(45),              -- IP ของผู้ใช้งานที่ทำรายการ (รองรับทั้ง IPv4 และ IPv6)
    user_agent TEXT,                     -- Browser / Client Information ของผู้เข้าใช้งาน
    created_by INTEGER,                  -- ID ของผู้ใช้งาน/แอดมินที่ทำรายการ (เชื่อมกับตาราง users)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- การทำ Indexing เพื่อประสิทธิภาพในการค้นหา Log ย้อนหลัง
CREATE INDEX idx_audit_logs_module_record ON audit_logs(module_name, record_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

COMMENT ON TABLE audit_logs IS 'ตารางเก็บ Log กลางสำหรับการบันทึกประวัติการสร้าง แก้ไข หรือลบข้อมูลสำคัญของระบบ';
COMMENT ON COLUMN audit_logs.log_id IS 'รหัส ID ของ Log แต่ละรายการ';
COMMENT ON COLUMN audit_logs.action_type IS 'ประเภทกิจกรรม (CREATE, UPDATE, DELETE)';
COMMENT ON COLUMN audit_logs.module_name IS 'ชื่อโมดูลหรือตารางหลัก เช่น organizations';
COMMENT ON COLUMN audit_logs.record_id IS 'ID อ้างอิงของแถวข้อมูลหลักที่ถูกกระทำ';
COMMENT ON COLUMN audit_logs.old_data IS 'ค่าข้อมูลชุดเดิมก่อนการเปลี่ยนแปลง';
COMMENT ON COLUMN audit_logs.new_data IS 'ค่าข้อมูลชุดใหม่ที่เพิ่งถูกบันทึก';
COMMENT ON COLUMN audit_logs.remark IS 'หมายเหตุหรือเหตุผลการดำเนินการ';
COMMENT ON COLUMN audit_logs.ip_address IS 'IP Address ของฝั่ง Client';
COMMENT ON COLUMN audit_logs.user_agent IS 'ข้อมูล Browser / Device Client';
COMMENT ON COLUMN audit_logs.created_by IS 'ID ของผู้ใช้ที่ทำรายการ';
COMMENT ON COLUMN audit_logs.created_at IS 'วันเวลาที่เกิดบันทึกกิจกรรม';
