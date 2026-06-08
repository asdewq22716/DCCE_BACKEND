CREATE TABLE approvals (
    id SERIAL PRIMARY KEY,
    ref_table VARCHAR(50) NOT NULL,
    ref_id VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL,
    payload JSONB,
    required_role VARCHAR(50),
    required_user_id VARCHAR(255),
    status VARCHAR(20) DEFAULT 'pending',
    current_level INT DEFAULT 1,
    max_level INT DEFAULT 1,
    requester_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_approvals_ref ON approvals (ref_table, ref_id);
CREATE INDEX idx_approvals_status ON approvals (status);

COMMENT ON TABLE approvals IS 'ตารางเก็บรายการคำขอที่รอการอนุมัติ (Global Approval Inbox)';
COMMENT ON COLUMN approvals.ref_table IS 'ชื่อตารางต้นทาง เช่น api_requests';
COMMENT ON COLUMN approvals.ref_id IS 'ID ของรายการในตารางต้นทาง (รองรับทั้งตัวเลขและ UUID)';
COMMENT ON COLUMN approvals.title IS 'หัวข้อคำขอ (ใช้แสดงผลในตาราง)';
COMMENT ON COLUMN approvals.payload IS 'ข้อมูลสรุปรายละเอียดคำขอในรูปแบบ JSON';
COMMENT ON COLUMN approvals.required_role IS 'กำหนดสิทธิ์ระดับ Role เช่น super_admin (ใครเป็น Role นี้ก็กดได้)';
COMMENT ON COLUMN approvals.required_user_id IS 'กำหนดสิทธิ์แบบเจาะจงบุคคล (user_id)';
COMMENT ON COLUMN approvals.status IS 'สถานะ: pending, approved, rejected, canceled';
COMMENT ON COLUMN approvals.current_level IS 'ระดับการอนุมัติปัจจุบัน';
COMMENT ON COLUMN approvals.max_level IS 'ระดับการอนุมัติสูงสุดที่ต้องการ';
COMMENT ON COLUMN approvals.requester_id IS 'รหัสพนักงาน/ผู้ที่ส่งคำขอ';

CREATE TABLE approval_logs (
    id SERIAL PRIMARY KEY,
    approval_id INT REFERENCES approvals(id) ON DELETE CASCADE,
    step INT NOT NULL,
    action VARCHAR(20) NOT NULL,
    comment TEXT,
    action_by VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_approval_logs_approval_id ON approval_logs (approval_id);

COMMENT ON TABLE approval_logs IS 'ตารางเก็บประวัติการกดอนุมัติ/ปฏิเสธ ของแต่ละคำขอ';
COMMENT ON COLUMN approval_logs.approval_id IS 'เชื่อมกับตาราง approvals';
COMMENT ON COLUMN approval_logs.step IS 'เป็นการอนุมัติในขั้นที่เท่าไหร่';
COMMENT ON COLUMN approval_logs.action IS 'การกระทำ: approved, rejected';
COMMENT ON COLUMN approval_logs.comment IS 'หมายเหตุ/เหตุผลประกอบ';
COMMENT ON COLUMN approval_logs.action_by IS 'รหัสผู้ดำเนินการ';
