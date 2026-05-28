CREATE TABLE banners (
    id SERIAL PRIMARY KEY,
    title_th VARCHAR(255) NOT NULL,
    title_en VARCHAR(255) NOT NULL,
    link_url VARCHAR(1000),
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP,
    is_never_ends SMALLINT DEFAULT 0,
    sort_order INTEGER,
    
    is_active SMALLINT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(100),
    deleted_at TIMESTAMP,
    deleted_by VARCHAR(100)
);

-- สร้าง Index เพื่อความเร็วในการค้นหา
CREATE INDEX idx_banners_active_date ON banners (is_active, start_date, end_date);
CREATE INDEX idx_banners_sort ON banners (sort_order);

COMMENT ON TABLE banners IS 'ตารางสำหรับเก็บข้อมูลแบนเนอร์';
COMMENT ON COLUMN banners.id IS 'Primary Key (รหัสแบนเนอร์)';
COMMENT ON COLUMN banners.title_th IS 'ชื่อแบนเนอร์ (ภาษาไทย)';
COMMENT ON COLUMN banners.title_en IS 'ชื่อแบนเนอร์ (ภาษาอังกฤษ)';
COMMENT ON COLUMN banners.link_url IS 'ลิงก์เป้าหมายเมื่อคลิกรูป';
COMMENT ON COLUMN banners.start_date IS 'วันที่เริ่มต้นแสดงผล';
COMMENT ON COLUMN banners.end_date IS 'วันที่สิ้นสุดแสดงผล (NULL = แสดงตลอดไป)';
COMMENT ON COLUMN banners.is_never_ends IS '1 = เปิดใช้งาน "จนกว่าจะกลับมาปิดอีกครั้ง"';
COMMENT ON COLUMN banners.sort_order IS 'ลำดับการแสดงผล';
COMMENT ON COLUMN banners.is_active IS '1 = เปิดใช้งาน, 0 = ปิดใช้งาน';
COMMENT ON COLUMN banners.created_at IS 'เวลาสร้าง';
COMMENT ON COLUMN banners.created_by IS 'ผู้สร้าง';
COMMENT ON COLUMN banners.updated_at IS 'เวลาแก้ไขล่าสุด';
COMMENT ON COLUMN banners.updated_by IS 'ผู้แก้ไขล่าสุด';
COMMENT ON COLUMN banners.deleted_at IS 'เวลาลบแบบ soft delete';
COMMENT ON COLUMN banners.deleted_by IS 'ผู้ลบ';
