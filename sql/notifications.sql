CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    message TEXT,
    type VARCHAR(50) DEFAULT 'INFO',
    action_url VARCHAR(500),
    payload JSONB,
    ref_table VARCHAR(50),
    ref_id VARCHAR(255),
    sender_id VARCHAR(255),
    target_role VARCHAR(50),
    target_user_id VARCHAR(255),
    is_read SMALLINT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_noti_target_role ON notifications(target_role);
CREATE INDEX idx_noti_target_user ON notifications(target_user_id);
CREATE INDEX idx_noti_is_read ON notifications(is_read);

COMMENT ON TABLE notifications IS 'ตารางแจ้งเตือนกลาง (Global Notifications)';
COMMENT ON COLUMN notifications.title IS 'หัวข้อแจ้งเตือน';
COMMENT ON COLUMN notifications.message IS 'รายละเอียดแจ้งเตือนแบบย่อ';
COMMENT ON COLUMN notifications.type IS 'ประเภทแจ้งเตือน (INFO, SUCCESS, WARNING, ERROR)';
COMMENT ON COLUMN notifications.action_url IS 'URL ปลายทางเมื่อกดคลิกที่แจ้งเตือน';
COMMENT ON COLUMN notifications.payload IS 'ข้อมูลเสริมในรูปแบบ JSON (เช่น avatar คนส่ง)';
COMMENT ON COLUMN notifications.ref_table IS 'ตารางต้นทาง (เช่น api_requests)';
COMMENT ON COLUMN notifications.ref_id IS 'ID ของข้อมูลต้นทาง';
COMMENT ON COLUMN notifications.sender_id IS 'ID ของผู้กระตุ้นแจ้งเตือน (หรือ system)';
COMMENT ON COLUMN notifications.target_role IS 'ส่งแจ้งเตือนหากลุ่มผู้ใช้งาน (Role)';
COMMENT ON COLUMN notifications.target_user_id IS 'ส่งแจ้งเตือนหาบุคคลเจาะจง (User ID)';
COMMENT ON COLUMN notifications.is_read IS 'สถานะการอ่าน (0=ยังไม่อ่าน, 1=อ่านแล้ว)';
