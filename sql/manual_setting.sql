CREATE TABLE manual_setting (
    id SERIAL PRIMARY KEY,
    remark VARCHAR(1000),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(100)
);

COMMENT ON TABLE manual_setting IS 'ตารางสำหรับเก็บการตั้งค่าดาวน์โหลดคู่มือการใช้งาน (Manual Setting)';
COMMENT ON COLUMN manual_setting.id IS 'Primary Key (ควรมีแค่ id=1)';
COMMENT ON COLUMN manual_setting.remark IS 'หมายเหตุ (ถ้ามี)';

-- เพิ่มข้อมูลแถวแรกเตรียมไว้เลย
INSERT INTO manual_setting (id, remark) VALUES (1, '');
