CREATE TABLE maintenance_settings (
    id SERIAL PRIMARY KEY,
    start_date DATE NOT NULL,
    start_time TIME,
    end_date DATE,
    end_time TIME,
    is_indefinite SMALLINT DEFAULT 0,
    
    auto_close_service SMALLINT DEFAULT 1,
    notify_admin SMALLINT DEFAULT 1,
    notify_admin_minutes INTEGER DEFAULT 30,
    remark TEXT,
    
    is_active SMALLINT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(100),
    deleted_at TIMESTAMP,
    deleted_by VARCHAR(100)
);

CREATE INDEX idx_maintenance_settings_active ON maintenance_settings (is_active);

COMMENT ON TABLE maintenance_settings IS 'ตารางตั้งค่าการปิดปรับปรุงระบบ (Maintenance Mode)';
COMMENT ON COLUMN maintenance_settings.id IS 'รหัสการตั้งค่า (มักจะมีแค่ Record เดียว คือ id=1)';
COMMENT ON COLUMN maintenance_settings.start_date IS 'วันที่ปิดปรับปรุงเริ่มต้น';
COMMENT ON COLUMN maintenance_settings.start_time IS 'เวลาปิดปรับปรุงเริ่มต้น';
COMMENT ON COLUMN maintenance_settings.end_date IS 'วันที่ปิดปรับปรุงสิ้นสุด (เป็น null ได้ถ้าไม่มีกำหนด)';
COMMENT ON COLUMN maintenance_settings.end_time IS 'เวลาปิดปรับปรุงสิ้นสุด (เป็น null ได้ถ้าไม่มีกำหนด)';
COMMENT ON COLUMN maintenance_settings.is_indefinite IS 'จนกว่าจะกลับมาเปิดอีกครั้ง (1 = ปิดแบบไม่มีกำหนด, 0 = มีกำหนด)';
COMMENT ON COLUMN maintenance_settings.auto_close_service IS 'ปิด Service อัตโนมัติเมื่อถึงเวลาที่กำหนด (1=เปิดใช้งาน, 0=ปิดใช้งาน)';
COMMENT ON COLUMN maintenance_settings.notify_admin IS 'แจ้งเตือนผู้ดูแลระบบก่อนปิด Service (1=เปิดใช้งาน, 0=ปิดใช้งาน)';
COMMENT ON COLUMN maintenance_settings.notify_admin_minutes IS 'แจ้งเตือนล่วงหน้า ... นาที';
COMMENT ON COLUMN maintenance_settings.remark IS 'หมายเหตุ (ถ้ามี)';
COMMENT ON COLUMN maintenance_settings.is_active IS 'สถานะการใช้งาน (1 = ใช้งาน, 0 = ยกเลิก)';
COMMENT ON COLUMN maintenance_settings.created_at IS 'วันที่สร้างข้อมูล';
COMMENT ON COLUMN maintenance_settings.created_by IS 'ผู้สร้างข้อมูล';
COMMENT ON COLUMN maintenance_settings.updated_at IS 'วันที่แก้ไขข้อมูลล่าสุด';
COMMENT ON COLUMN maintenance_settings.updated_by IS 'ผู้แก้ไขข้อมูลล่าสุด';
COMMENT ON COLUMN maintenance_settings.deleted_at IS 'วันที่ลบข้อมูล (Soft Delete)';
COMMENT ON COLUMN maintenance_settings.deleted_by IS 'ผู้ลบข้อมูล';

-- เพิ่มข้อมูลแถวแรกเริ่มต้น
INSERT INTO maintenance_settings (id, start_date, start_time, auto_close_service, notify_admin, notify_admin_minutes) 
VALUES (1, CURRENT_DATE, '02:00:00', 1, 1, 30)
ON CONFLICT DO NOTHING;
