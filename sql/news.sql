CREATE TABLE news (
    id SERIAL PRIMARY KEY,
    title_th VARCHAR(255) NOT NULL,
    title_en VARCHAR(255) NOT NULL,
    detail_th TEXT,
    detail_en TEXT,
    tags JSONB,
    link_url VARCHAR(1000),
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP,
    is_never_ends SMALLINT DEFAULT 0,
    is_active SMALLINT DEFAULT 1,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(100),
    deleted_at TIMESTAMP,
    deleted_by VARCHAR(100)
);

CREATE INDEX idx_news_active_date ON news (is_active, start_date, end_date);

COMMENT ON TABLE news IS 'ตารางสำหรับเก็บข้อมูลข่าวประชาสัมพันธ์';
COMMENT ON COLUMN news.title_th IS 'ชื่อข่าวประชาสัมพันธ์ (ภาษาไทย)';
COMMENT ON COLUMN news.title_en IS 'ชื่อข่าวประชาสัมพันธ์ (ภาษาอังกฤษ)';
COMMENT ON COLUMN news.detail_th IS 'รายละเอียด (ภาษาไทย)';
COMMENT ON COLUMN news.detail_en IS 'รายละเอียด (ภาษาอังกฤษ)';
COMMENT ON COLUMN news.tags IS 'แท็กต่างๆ เก็บในรูปแบบ JSON Array เช่น ["ข่าวไอที", "กิจกรรม"]';
COMMENT ON COLUMN news.link_url IS 'ลิงก์เป้าหมาย (อ้างอิงจากตาราง UI)';
COMMENT ON COLUMN news.start_date IS 'วันที่เริ่มต้น';
COMMENT ON COLUMN news.end_date IS 'วันที่สิ้นสุด';
COMMENT ON COLUMN news.is_never_ends IS '1 = เปิดใช้งานจนกว่าจะปิด';
COMMENT ON COLUMN news.is_active IS '1 = แสดงผล, 0 = ไม่แสดงผล';
