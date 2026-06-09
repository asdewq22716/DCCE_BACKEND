CREATE TABLE system_services (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    remark TEXT,
    
    -- Checkbox fields (1 field per checkbox)
    permission_by_org SMALLINT DEFAULT 0,
    permission_by_role SMALLINT DEFAULT 0,
    manage_external_permission SMALLINT DEFAULT 0,
    manage_system_service SMALLINT DEFAULT 0,
    view_change_history SMALLINT DEFAULT 0,
    
    -- Status
    is_active SMALLINT DEFAULT 1,
    
    -- Standard Audit fields
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(100),
    deleted_at TIMESTAMP,
    deleted_by VARCHAR(100)
);

CREATE INDEX idx_system_services_active ON system_services (is_active);

COMMENT ON TABLE system_services IS 'ตารางเก็บข้อมูล Service ของระบบและการตั้งค่าสิทธิ์ภายใน';
COMMENT ON COLUMN system_services.id IS 'รหัส Service';
COMMENT ON COLUMN system_services.name IS 'ชื่อ Service เช่น รายงาน, ระบบจัดการผู้ใช้';
COMMENT ON COLUMN system_services.remark IS 'หมายเหตุ';
COMMENT ON COLUMN system_services.permission_by_org IS 'สิทธิ์ตามหน่วยงาน (0=ไม่เลือก, 1=เลือก)';
COMMENT ON COLUMN system_services.permission_by_role IS 'สิทธิ์ตามบทบาทผู้ใช้งาน (0=ไม่เลือก, 1=เลือก)';
COMMENT ON COLUMN system_services.manage_external_permission IS 'จัดการสิทธิ์บุคคลภายนอก (0=ไม่เลือก, 1=เลือก)';
COMMENT ON COLUMN system_services.manage_system_service IS 'จัดการ Service ของระบบ (0=ไม่เลือก, 1=เลือก)';
COMMENT ON COLUMN system_services.view_change_history IS 'ประวัติการเปลี่ยนแปลง (0=ไม่เลือก, 1=เลือก)';
COMMENT ON COLUMN system_services.is_active IS 'สถานะการใช้งาน (1 = เปิดการใช้งาน, 0 = ปิดการใช้งาน)';
COMMENT ON COLUMN system_services.created_at IS 'วันที่สร้างข้อมูล';
COMMENT ON COLUMN system_services.created_by IS 'ผู้สร้างข้อมูล';
COMMENT ON COLUMN system_services.updated_at IS 'วันที่แก้ไขข้อมูลล่าสุด';
COMMENT ON COLUMN system_services.updated_by IS 'ผู้แก้ไขข้อมูลล่าสุด';
COMMENT ON COLUMN system_services.deleted_at IS 'วันที่ลบข้อมูล (Soft Delete)';
COMMENT ON COLUMN system_services.deleted_by IS 'ผู้ลบข้อมูล';

-- Insert Initial Mock Data
INSERT INTO system_services (name, is_active) VALUES ('รายงาน', 1);
INSERT INTO system_services (name, is_active) VALUES ('ระบบจัดการผู้ใช้', 0);
