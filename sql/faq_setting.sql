CREATE TABLE faq_setting (
    id SERIAL PRIMARY KEY,
    question VARCHAR(1000) NOT NULL,
    answer TEXT NOT NULL,
    is_active SMALLINT DEFAULT 1,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(100),
    deleted_at TIMESTAMP,
    deleted_by VARCHAR(100)
);

CREATE INDEX idx_faq_setting_active ON faq_setting (is_active);

COMMENT ON TABLE faq_setting IS 'ตารางสำหรับเก็บข้อมูลคำถามที่พบบ่อย (FAQ)';
COMMENT ON COLUMN faq_setting.question IS 'หัวข้อคำถาม';
COMMENT ON COLUMN faq_setting.answer IS 'คำตอบ';
COMMENT ON COLUMN faq_setting.is_active IS '1 = เปิดใช้งาน, 0 = ปิดใช้งาน';
