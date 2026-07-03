-- 1. ตารางเก็บ API Token
CREATE TABLE IF NOT EXISTS api_tokens (
    id SERIAL PRIMARY KEY,
    request_id VARCHAR(50) NOT NULL,
    token VARCHAR(255) NOT NULL UNIQUE,
    is_active INT DEFAULT 1,
    expired_at TIMESTAMP,
    last_used_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- เพิ่ม Comment ให้ตารางและคอลัมน์ของ api_tokens
COMMENT ON TABLE api_tokens IS 'ตารางสำหรับเก็บ API Token ที่ออกให้ผู้ใช้งานหลังจากคำขอ (api_requests) ได้รับการอนุมัติ';
COMMENT ON COLUMN api_tokens.id IS 'รหัสอ้างอิงของ Token (Primary Key)';
COMMENT ON COLUMN api_tokens.request_id IS 'รหัสคำขอที่ใช้อ้างอิงไปยังตาราง api_requests (เช่น API-2026-001)';
COMMENT ON COLUMN api_tokens.token IS 'รหัส Token (UUID) ที่ใช้สำหรับการยืนยันตัวตน (Authentication) ผ่าน Header x-api-key';
COMMENT ON COLUMN api_tokens.is_active IS 'สถานะการใช้งาน: 1 = เปิดใช้งาน (Active), 0 = ระงับการใช้งาน (Inactive/Revoked)';
COMMENT ON COLUMN api_tokens.expired_at IS 'วันและเวลาที่ Token หมดอายุ (หากเป็น NULL หมายถึงไม่มีวันหมดอายุ)';
COMMENT ON COLUMN api_tokens.last_used_at IS 'วันและเวลาล่าสุดที่มีการนำ Token นี้มาเรียกใช้งาน API';
COMMENT ON COLUMN api_tokens.created_at IS 'วันและเวลาที่สร้าง Token นี้';
COMMENT ON COLUMN api_tokens.updated_at IS 'วันและเวลาที่แก้ไขข้อมูล Token นี้ล่าสุด';


-- 2. ตารางเก็บประวัติการใช้งาน (Usage Logs)
CREATE TABLE IF NOT EXISTS api_usage_logs (
    id SERIAL PRIMARY KEY,
    token VARCHAR(255) NOT NULL,
    endpoint VARCHAR(255),
    ip_address VARCHAR(50),
    status_code INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- เพิ่ม Comment ให้ตารางและคอลัมน์ของ api_usage_logs
COMMENT ON TABLE api_usage_logs IS 'ตารางสำหรับเก็บประวัติการเรียกใช้งาน Report API ด้วย Token เพื่อใช้ในการตรวจสอบ (Audit) และติดตามการใช้งาน (Tracking)';
COMMENT ON COLUMN api_usage_logs.id IS 'รหัสอ้างอิงประวัติการใช้งาน (Primary Key)';
COMMENT ON COLUMN api_usage_logs.token IS 'รหัส Token ที่ใช้ในการเรียก API ในครั้งนั้น';
COMMENT ON COLUMN api_usage_logs.endpoint IS 'URL หรือ Endpoint ที่ถูกเรียกใช้งาน (เช่น /reports/fact-api-detail)';
COMMENT ON COLUMN api_usage_logs.ip_address IS 'IP Address ของเครื่องต้นทางที่เรียกใช้งาน API';
COMMENT ON COLUMN api_usage_logs.status_code IS 'HTTP Status Code ที่ตอบกลับไป (เช่น 200 = สำเร็จ, 403 = ปฏิเสธ)';
COMMENT ON COLUMN api_usage_logs.created_at IS 'วันและเวลาที่เกิดการเรียกใช้งาน API';
