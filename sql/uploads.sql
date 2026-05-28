CREATE TABLE uploads (
    id SERIAL PRIMARY KEY,
    original_name VARCHAR(255) NOT NULL,
    saved_name VARCHAR(255) NOT NULL,
    path VARCHAR(2000) NOT NULL,
    mime_type VARCHAR(100),
    size BIGINT,
    extension VARCHAR(20),
    ref_table VARCHAR(50),
    ref_id INTEGER,
    tag VARCHAR(50),
    sort_order INTEGER DEFAULT 1,
    is_temp SMALLINT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    deleted_at TIMESTAMP,
    deleted_by VARCHAR(100),
    is_active SMALLINT DEFAULT 1
);

CREATE INDEX idx_uploads_ref ON uploads (ref_table, ref_id);
CREATE INDEX idx_uploads_temp_cleanup ON uploads (is_temp, created_at);

COMMENT ON TABLE uploads IS 'ตารางสำหรับเก็บข้อมูลการอัปโหลดไฟล์';
COMMENT ON COLUMN uploads.id IS 'Primary Key ของไฟล์';
COMMENT ON COLUMN uploads.original_name IS 'ชื่อไฟล์ต้นฉบับ';
COMMENT ON COLUMN uploads.saved_name IS 'ชื่อที่บันทึกจริงในระบบ';
COMMENT ON COLUMN uploads.path IS 'พาร์ทไฟล์ เช่น /uploads/xxx.jpg';
COMMENT ON COLUMN uploads.mime_type IS 'ประเภทไฟล์ เช่น image/jpeg';
COMMENT ON COLUMN uploads.size IS 'ขนาดไฟล์ (bytes)';
COMMENT ON COLUMN uploads.extension IS 'นามสกุลไฟล์ .jpg, .pdf';
COMMENT ON COLUMN uploads.ref_table IS 'ตารางที่อ้างถึง เช่น users, banners';
COMMENT ON COLUMN uploads.ref_id IS 'id ที่ผูก เช่น user_id = 2';
COMMENT ON COLUMN uploads.tag IS 'ประเภทไฟล์ เช่น avatar, banner';
COMMENT ON COLUMN uploads.sort_order IS 'ลำดับการเรียงลำดับไฟล์';
COMMENT ON COLUMN uploads.is_temp IS '1 = เป็นไฟล์ชั่วคราว, 0 = ไฟล์จริง';
COMMENT ON COLUMN uploads.created_at IS 'เวลาสร้าง';
COMMENT ON COLUMN uploads.created_by IS 'ชื่อคนสร้าง';
COMMENT ON COLUMN uploads.deleted_at IS 'เวลาลบแบบ soft delete';
COMMENT ON COLUMN uploads.deleted_by IS 'ชื่อคนที่ลบ';
COMMENT ON COLUMN uploads.is_active IS '0 = ไม่ทำงาน, 1 = ทำงาน';

-- หากรันตาราง `uploads` ไปแล้ว ให้รันสคริปต์นี้เพื่อเพิ่ม sort_order:
--
-- ALTER TABLE uploads ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 1;
--
-- COMMENT ON COLUMN uploads.sort_order IS 'ลำดับการเรียงลำดับไฟล์';
