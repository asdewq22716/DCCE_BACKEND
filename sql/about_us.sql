CREATE TABLE about_us (
    id SERIAL PRIMARY KEY,
    topic_th VARCHAR(255),
    topic_en VARCHAR(255),
    detail_th TEXT,
    detail_en TEXT,
    bg_text_th VARCHAR(255),
    bg_text_en VARCHAR(255),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(100)
);

COMMENT ON TABLE about_us IS 'ตารางสำหรับเก็บการตั้งค่าเกี่ยวกับเรา (About Us)';
COMMENT ON COLUMN about_us.id IS 'Primary Key (ควรมีแค่ id=1)';
COMMENT ON COLUMN about_us.topic_th IS 'หัวข้อหลัก (ภาษาไทย)';
COMMENT ON COLUMN about_us.topic_en IS 'หัวข้อหลัก (ภาษาอังกฤษ)';
COMMENT ON COLUMN about_us.detail_th IS 'รายละเอียด (ภาษาไทย)';
COMMENT ON COLUMN about_us.detail_en IS 'รายละเอียด (ภาษาอังกฤษ)';
COMMENT ON COLUMN about_us.bg_text_th IS 'ข้อความ Background ขนาดใหญ่ (ภาษาไทย)';
COMMENT ON COLUMN about_us.bg_text_en IS 'ข้อความ Background ขนาดใหญ่ (ภาษาอังกฤษ)';

-- เพิ่มข้อมูลแถวแรกเตรียมไว้เลย
INSERT INTO about_us (id, topic_th, topic_en) VALUES (1, '', '');
