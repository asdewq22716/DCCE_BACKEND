CREATE TABLE master_tags (
    id SERIAL PRIMARY KEY,
    name_th VARCHAR(100) NOT NULL,
    name_en VARCHAR(100) NOT NULL,
    is_active SMALLINT DEFAULT 1,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(100),
    deleted_at TIMESTAMP,
    deleted_by VARCHAR(100)
);

CREATE INDEX idx_master_tags_active ON master_tags (is_active);

COMMENT ON TABLE master_tags IS 'ตารางมาสเตอร์สำหรับเก็บข้อมูลแท็ก (Tags)';
COMMENT ON COLUMN master_tags.id IS 'Primary Key ของแท็ก';
COMMENT ON COLUMN master_tags.name_th IS 'ชื่อแท็ก (ภาษาไทย)';
COMMENT ON COLUMN master_tags.name_en IS 'ชื่อแท็ก (ภาษาอังกฤษ)';
COMMENT ON COLUMN master_tags.is_active IS '1 = ใช้งาน, 0 = ปิดใช้งาน';

-- เพิ่มข้อมูลตัวอย่าง
INSERT INTO master_tags (name_th, name_en) VALUES 
('ข่าวกรมวิทย์ฯ', 'Department of Science News'),
('อิเล็กทรอนิกส์', 'Electronics'),
('สิ่งแวดล้อม', 'Environment'),
('พลังงาน', 'Energy');
