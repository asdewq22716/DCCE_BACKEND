# 📘 DCCE Backend — Data Dictionary

> โครงสร้างฐานข้อมูล PostgreSQL สำหรับระบบ DCCE Backend  
> ครอบคลุม Authentication, RBAC, Organization, Content Management และ Audit Logging

---

## 📊 ภาพรวม

| รายการ | จำนวน |
|--------|-------|
| ตารางทั้งหมด | 13 ตาราง |
| Columns ทั้งหมด | ~107 columns |
| SQL Files | 6 ไฟล์ |
| Database | PostgreSQL |

---

## 📂 โครงสร้างไฟล์ SQL

| ไฟล์ | ตาราง |
|------|-------|
| `permissions.sql` | users, roles, user_roles, permission_groups, permissions, role_permissions, user_permissions |
| `organizations.sql` | organizations, user_organizations, organization_permissions |
| `roles.sql` | roles (seed data) |
| `banners.sql` | banners |
| `uploads.sql` | uploads |
| `audit_logs.sql` | audit_logs |

---

## 🏷️ หมายเหตุสัญลักษณ์

| สัญลักษณ์ | ความหมาย |
|-----------|---------|
| 🔑 PK | Primary Key |
| ❗ NOT NULL | ต้องมีค่า |
| ✅ NULLABLE | ไม่บังคับ |
| 🔵 DEFAULT | มีค่าเริ่มต้น |
| 📇 IDX | มี Index |

---

## 👤 ตาราง: `users`

> ข้อมูลผู้ใช้งานที่ Sync มาจาก SSO และข้อมูลท้องถิ่นในระบบ

| # | Column Name | Data Type | Flags | คำอธิบาย |
|---|-------------|-----------|-------|---------|
| 1 | `user_id` | SERIAL | 🔑 PK, ❗ NOT NULL | ID ลำดับที่ของผู้ใช้งานในระบบ (Auto Increment) |
| 2 | `sso_userid` | VARCHAR(100) | ✅ NULLABLE, 📇 IDX | รหัส Unique ID จากระบบ SSO |
| 3 | `sso_username` | VARCHAR(100) | ✅ NULLABLE | ชื่อผู้ใช้งาน (Username) จาก SSO |
| 4 | `sso_token` | TEXT | ✅ NULLABLE | Access Token ล่าสุดจาก SSO |
| 5 | `sso_idcard_no` | VARCHAR(20) | ✅ NULLABLE | เลขบัตรประจำตัวประชาชน |
| 6 | `sso_email` | VARCHAR(255) | ✅ NULLABLE | อีเมลผู้ใช้งาน |
| 7 | `sso_prefix_name` | VARCHAR(100) | ✅ NULLABLE | คำนำหน้าชื่อ (นาย, นาง, นางสาว) |
| 8 | `sso_firstname` | VARCHAR(100) | ✅ NULLABLE | ชื่อจริง จาก SSO |
| 9 | `sso_lastname` | VARCHAR(100) | ✅ NULLABLE | นามสกุล จาก SSO |
| 10 | `sso_work_position_text` | VARCHAR(255) | ✅ NULLABLE | ชื่อตำแหน่งงาน (ข้อความ) จาก SSO |
| 11 | `sso_work_place_text` | VARCHAR(255) | ✅ NULLABLE | ชื่อสถานที่ทำงาน (ข้อความรวม) |
| 12 | `sso_work_place_id` | VARCHAR(100) | ✅ NULLABLE | รหัสสถานที่ทำงาน |
| 13 | `sso_work_place_name` | VARCHAR(255) | ✅ NULLABLE | ชื่อสถานที่ทำงาน (กรม/สำนัก) |
| 14 | `sso_division_name` | VARCHAR(255) | ✅ NULLABLE | ชื่อกอง/ส่วน จาก SSO |
| 15 | `sso_sub_division_name` | VARCHAR(255) | ✅ NULLABLE | ชื่อฝ่าย/กลุ่มงานย่อย จาก SSO |
| 16 | `full_name` | VARCHAR(255) | ✅ NULLABLE | ชื่อ-นามสกุลเต็ม สำหรับแสดงผลในระบบ |
| 17 | `is_active` | SMALLINT | 🔵 DEFAULT 1 | สถานะการเปิดใช้งาน (1 = ปกติ, 0 = ระงับ) |
| 18 | `permission_status` | SMALLINT | 🔵 DEFAULT 1 | สถานะสิทธิ์ (1 = เปิด, 0 = ปิด, 2 = บล็อก) |
| 19 | `permission_remark` | TEXT | ✅ NULLABLE | หมายเหตุการบล็อกหรือปิดการใช้งาน |
| 20 | `last_login` | TIMESTAMP | ✅ NULLABLE | วันเวลาที่เข้าสู่ระบบครั้งล่าสุด |
| 21 | `created_at` | TIMESTAMP | 🔵 DEFAULT NOW() | วันเวลาที่สร้าง record |
| 22 | `updated_at` | TIMESTAMP | 🔵 DEFAULT NOW() | วันเวลาที่อัปเดตล่าสุด |

**Indexes:**
- `idx_users_sso_userid` ON `(sso_userid)`

---

## 🎭 ตาราง: `roles`

> ตารางนิยามตำแหน่งหรือบทบาทการทำงาน เช่น ADMIN, EDITOR, VIEWER

| # | Column Name | Data Type | Flags | คำอธิบาย |
|---|-------------|-----------|-------|---------|
| 1 | `role_id` | SERIAL | 🔑 PK, ❗ NOT NULL | รหัส ID ของบทบาท (Auto Increment) |
| 2 | `role_name` | VARCHAR(100) | ❗ NOT NULL, UNIQUE | ชื่อบทบาท (ภาษาอังกฤษตัวพิมพ์ใหญ่ เช่น ADMIN, EDITOR, VIEWER) |
| 3 | `description` | TEXT | ✅ NULLABLE | รายละเอียดขอบเขตและหน้าที่ของบทบาทนี้ |
| 4 | `is_active` | SMALLINT | 🔵 DEFAULT 1 | สถานะการใช้งาน (1 = ปกติ, 0 = ลบแบบ Soft Delete) |
| 5 | `created_at` | TIMESTAMP | 🔵 DEFAULT NOW() | วันเวลาที่สร้าง |
| 6 | `updated_at` | TIMESTAMP | 🔵 DEFAULT NOW() | วันเวลาที่อัปเดตล่าสุด |

**Seed Data เริ่มต้น:**

| role_name | description |
|-----------|-------------|
| `ADMIN` | ผู้ดูแลระบบสูงสุด สามารถเข้าถึงและจัดการได้ทุกเมนู |
| `EDITOR` | ผู้บันทึก/แก้ไขข้อมูล สามารถบันทึกข้อมูลหน่วยงานและส่งออกข้อมูลได้ |
| `VIEWER` | ผู้เข้าชม/ดูรายงานทั่วไป สามารถเปิดดูข้อมูลและหน้า Dashboard ได้เท่านั้น |

---

## 🔗 ตาราง: `user_roles`

> ตารางจับคู่ผู้ใช้งานกับบทบาท (Many-to-Many: 1 user มีได้หลาย role)

| # | Column Name | Data Type | Flags | คำอธิบาย |
|---|-------------|-----------|-------|---------|
| 1 | `user_id` | INTEGER | 🔑 PK (Composite), ❗ NOT NULL | ID ของผู้ใช้งาน (อ้างอิง `users.user_id`) |
| 2 | `role_id` | INTEGER | 🔑 PK (Composite), ❗ NOT NULL | ID ของบทบาท (อ้างอิง `roles.role_id`) |

> **Primary Key:** Composite PK จาก `(user_id, role_id)`

---

## 📁 ตาราง: `permission_groups`

> ตารางกลุ่มของสิทธิ์การใช้งาน รองรับโครงสร้างแบบ Tree (parent_id)

| # | Column Name | Data Type | Flags | คำอธิบาย |
|---|-------------|-----------|-------|---------|
| 1 | `group_id` | SERIAL | 🔑 PK, ❗ NOT NULL | รหัสกลุ่มสิทธิ์ (Auto Increment) |
| 2 | `group_name` | VARCHAR(100) | ❗ NOT NULL, UNIQUE | ชื่อกลุ่มสิทธิ์ เช่น ระบบสมาชิก, รายงาน |
| 3 | `parent_id` | INTEGER | ✅ NULLABLE | ID ของกลุ่มแม่ (ถ้ามี) สำหรับทำโครงสร้างแบบ Tree |
| 4 | `sort_order` | INTEGER | 🔵 DEFAULT 0 | ลำดับการแสดงผลของกลุ่มสิทธิ์ |
| 5 | `is_active` | SMALLINT | 🔵 DEFAULT 1 | สถานะการใช้งาน (1 = ใช้งาน, 0 = ปิด) |
| 6 | `created_at` | TIMESTAMP | 🔵 DEFAULT NOW() | วันเวลาที่สร้าง |
| 7 | `updated_at` | TIMESTAMP | 🔵 DEFAULT NOW() | วันเวลาที่อัปเดตล่าสุด |

---

## 🔑 ตาราง: `permissions`

> ตารางนิยามสิทธิ์การเข้าถึงเมนูหรือฟังก์ชัน (กุญแจสิทธิ์) เช่น `user.view`, `banner.edit`

| # | Column Name | Data Type | Flags | คำอธิบาย |
|---|-------------|-----------|-------|---------|
| 1 | `permission_id` | SERIAL | 🔑 PK, ❗ NOT NULL | รหัสสิทธิ์ (Auto Increment) |
| 2 | `p_key` | VARCHAR(100) | ❗ NOT NULL, UNIQUE | รหัสสิทธิ์แบบ key เช่น `user.view`, `banner.edit` |
| 3 | `p_label` | VARCHAR(255) | ✅ NULLABLE | ชื่อเรียกสิทธิ์ที่เข้าใจง่าย สำหรับแสดงผลในหน้าจอ |
| 4 | `group_id` | INTEGER | ✅ NULLABLE | ID ของกลุ่มสิทธิ์ (อ้างอิง `permission_groups.group_id`) |
| 5 | `is_active` | SMALLINT | 🔵 DEFAULT 1 | สถานะการใช้งาน (1 = ใช้งาน, 0 = ปิด) |
| 6 | `created_at` | TIMESTAMP | 🔵 DEFAULT NOW() | วันเวลาที่สร้าง |
| 7 | `updated_at` | TIMESTAMP | 🔵 DEFAULT NOW() | วันเวลาที่อัปเดตล่าสุด |

---

## 🔗 ตาราง: `role_permissions`

> ตารางจับคู่บทบาทกับสิทธิ์ย่อย (Many-to-Many: 1 role มีได้หลาย permission)

| # | Column Name | Data Type | Flags | คำอธิบาย |
|---|-------------|-----------|-------|---------|
| 1 | `role_id` | INTEGER | 🔑 PK (Composite), ❗ NOT NULL | ID ของบทบาท (อ้างอิง `roles.role_id`) |
| 2 | `permission_id` | INTEGER | 🔑 PK (Composite), ❗ NOT NULL | ID ของสิทธิ์ (อ้างอิง `permissions.permission_id`) |

> **Primary Key:** Composite PK จาก `(role_id, permission_id)`

---

## ⚡ ตาราง: `user_permissions`

> ตารางให้สิทธิ์พิเศษรายบุคคล (Override) อิงตามหน่วยงาน — สามารถ Allow หรือ Deny ได้

| # | Column Name | Data Type | Flags | คำอธิบาย |
|---|-------------|-----------|-------|---------|
| 1 | `user_permissions_id` | SERIAL | 🔑 PK, ❗ NOT NULL | รหัส ID ของสิทธิ์พิเศษรายบุคคล (Auto Increment) |
| 2 | `user_id` | INTEGER | ❗ NOT NULL | ID ของผู้ใช้งาน (อ้างอิง `users.user_id`) |
| 3 | `org_id` | INTEGER | ✅ NULLABLE | ID ของหน่วยงาน — NULL = สิทธิ์ Global ไม่จำกัดหน่วยงาน |
| 4 | `permission_id` | INTEGER | ❗ NOT NULL | ID ของสิทธิ์ย่อย (อ้างอิง `permissions.permission_id`) |
| 5 | `is_deny` | SMALLINT | 🔵 DEFAULT 0 | 1 = ห้ามเข้าถึงแม้ Role/Org จะอนุญาต, 0 = อนุญาต |
| 6 | `expired_at` | TIMESTAMP | ✅ NULLABLE | วันหมดอายุของสิทธิ์พิเศษ — NULL = ไม่มีวันหมดอายุ |
| 7 | `remark` | TEXT | ✅ NULLABLE | หมายเหตุการให้หรือระงับสิทธิ์ |
| 8 | `created_at` | TIMESTAMP | 🔵 DEFAULT NOW() | วันเวลาที่บันทึก |

**Unique Constraint:** `unique_user_org_permission` ON `(user_id, org_id, permission_id)`

---

## 🏢 ตาราง: `organizations`

> ตารางเก็บโครงสร้างองค์กรแบบลำดับชั้น (Hierarchical) — สาขา, กรม, กอง, ฝ่าย

| # | Column Name | Data Type | Flags | คำอธิบาย |
|---|-------------|-----------|-------|---------|
| 1 | `org_id` | SERIAL | 🔑 PK, ❗ NOT NULL | รหัสหน่วยงาน (Auto Increment) |
| 2 | `org_name` | VARCHAR(255) | ❗ NOT NULL | ชื่อหน่วยงาน เช่น สาขาระยอง, กรม C |
| 3 | `parent_id` | INTEGER | ✅ NULLABLE, 📇 IDX | ID ของหน่วยงานแม่ข่าย — NULL = หน่วยงานระดับสูงสุด (root) |
| 4 | `sort_order` | INTEGER | 🔵 DEFAULT 0 | ลำดับการแสดงผลในหน้าจอ |
| 5 | `level` | INTEGER | 🔵 DEFAULT 1 | ระดับความลึก (1 = สาขาหลัก, 2 = กอง/กรมย่อย, 3 = ฝ่าย/กลุ่มงาน) |
| 6 | `is_active` | SMALLINT | 🔵 DEFAULT 1, 📇 IDX | สถานะการใช้งาน (1 = เปิด, 0 = ปิด/Soft Delete) |
| 7 | `permission_is_active` | SMALLINT | 🔵 DEFAULT 1 | สถานะการใช้งานสิทธิ์ของหน่วยงานนี้ (1 = เปิด, 0 = ปิดชั่วคราว) |
| 8 | `permission_remark` | TEXT | ✅ NULLABLE | หมายเหตุเกี่ยวกับการตั้งค่าสิทธิ์ของหน่วยงานนี้ |
| 9 | `unit_data_permissions` | INTEGER | ✅ NULLABLE | ระดับการเข้าถึงข้อมูล (1=เฉพาะหน่วยงานตนเอง, 2=ระดับกรม, 3=ระดับประเทศ) |
| 10 | `unit_view_climate_index` | SMALLINT | ✅ NULLABLE | สิทธิ์ดูข้อมูลดัชนีภูมิอากาศ (1 = มีสิทธิ์, 0 = ไม่มี) |
| 11 | `unit_view_ghg_emissions` | SMALLINT | ✅ NULLABLE | สิทธิ์ดูข้อมูลการปล่อยก๊าซเรือนกระจก (1 = มีสิทธิ์, 0 = ไม่มี) |
| 12 | `unit_edit_historical_data` | SMALLINT | ✅ NULLABLE | สิทธิ์แก้ไขข้อมูลย้อนหลัง (1 = มีสิทธิ์, 0 = ไม่มี) |
| 13 | `unit_approve_public_data` | SMALLINT | ✅ NULLABLE | สิทธิ์อนุมัติการเผยแพร่ข้อมูลสาธารณะ (1 = มีสิทธิ์, 0 = ไม่มี) |
| 14 | `unit_remark` | TEXT | ✅ NULLABLE | หมายเหตุของหน่วยงานย่อย (ถ้ามี) |
| 15 | `created_at` | TIMESTAMP | 🔵 DEFAULT NOW() | วันเวลาที่สร้าง |
| 16 | `updated_at` | TIMESTAMP | 🔵 DEFAULT NOW() | วันเวลาที่อัปเดตล่าสุด |

**Indexes:**
- `idx_organizations_parent_id` ON `(parent_id)`
- `idx_organizations_is_active` ON `(is_active)`

---

## 🔗 ตาราง: `user_organizations`

> ตารางจับคู่ผู้ใช้งานกับหน่วยงาน — รองรับกรณี 1 คนสังกัดหลายกรม/สาขา

| # | Column Name | Data Type | Flags | คำอธิบาย |
|---|-------------|-----------|-------|---------|
| 1 | `user_id` | INTEGER | 🔑 PK (Composite), ❗ NOT NULL | ID ของผู้ใช้งาน (อ้างอิง `users.user_id`) |
| 2 | `org_id` | INTEGER | 🔑 PK (Composite), ❗ NOT NULL | ID ของหน่วยงาน (อ้างอิง `organizations.org_id`) |
| 3 | `is_primary` | SMALLINT | 🔵 DEFAULT 0, 📇 IDX | สถานะสังกัดหลัก (1 = สังกัดหลัก, 0 = สิทธิ์เข้าถึงเพิ่มเติม) |

> **Primary Key:** Composite PK จาก `(user_id, org_id)`

**Indexes:**
- `idx_user_organizations_is_primary` ON `(is_primary)`

---

## 🔗 ตาราง: `organization_permissions`

> ตารางจับคู่หน่วยงาน/สาขากับสิทธิ์การใช้งาน (แทนที่ role_permissions สำหรับระบบนี้)

| # | Column Name | Data Type | Flags | คำอธิบาย |
|---|-------------|-----------|-------|---------|
| 1 | `org_id` | INTEGER | 🔑 PK (Composite), ❗ NOT NULL | ID ของหน่วยงาน (อ้างอิง `organizations.org_id`) |
| 2 | `permission_id` | INTEGER | 🔑 PK (Composite), ❗ NOT NULL | ID ของสิทธิ์ย่อย (อ้างอิง `permissions.permission_id`) |

> **Primary Key:** Composite PK จาก `(org_id, permission_id)`

---

## 🖼️ ตาราง: `banners`

> ตารางสำหรับเก็บข้อมูลแบนเนอร์ที่แสดงบน Homepage — รองรับ Soft Delete และ 2 ภาษา

| # | Column Name | Data Type | Flags | คำอธิบาย |
|---|-------------|-----------|-------|---------|
| 1 | `id` | SERIAL | 🔑 PK, ❗ NOT NULL | รหัสแบนเนอร์ Primary Key (Auto Increment) |
| 2 | `title_th` | VARCHAR(255) | ❗ NOT NULL | ชื่อ/หัวข้อแบนเนอร์ ภาษาไทย |
| 3 | `title_en` | VARCHAR(255) | ❗ NOT NULL | ชื่อ/หัวข้อแบนเนอร์ ภาษาอังกฤษ |
| 4 | `link_url` | VARCHAR(1000) | ✅ NULLABLE | ลิงก์เป้าหมายเมื่อผู้ใช้คลิกแบนเนอร์ |
| 5 | `start_date` | TIMESTAMP | ❗ NOT NULL, 📇 IDX | วันที่เริ่มต้นแสดงผลแบนเนอร์ |
| 6 | `end_date` | TIMESTAMP | ✅ NULLABLE, 📇 IDX | วันที่สิ้นสุดแสดงผล — NULL = แสดงตลอดไป |
| 7 | `is_never_ends` | SMALLINT | 🔵 DEFAULT 0 | 1 = ไม่มีวันหมดอายุ, 0 = มีวันหมดอายุ |
| 8 | `sort_order` | INTEGER | ✅ NULLABLE, 📇 IDX | ลำดับการแสดงผลของแบนเนอร์ |
| 9 | `is_active` | SMALLINT | 🔵 DEFAULT 1, 📇 IDX | สถานะ (1 = เปิดใช้งาน, 0 = ปิด) |
| 10 | `created_at` | TIMESTAMP | 🔵 DEFAULT NOW() | วันเวลาที่สร้าง |
| 11 | `created_by` | VARCHAR(100) | ✅ NULLABLE | ชื่อผู้สร้างแบนเนอร์ |
| 12 | `updated_at` | TIMESTAMP | 🔵 DEFAULT NOW() | วันเวลาที่แก้ไขล่าสุด |
| 13 | `updated_by` | VARCHAR(100) | ✅ NULLABLE | ชื่อผู้แก้ไขล่าสุด |
| 14 | `deleted_at` | TIMESTAMP | ✅ NULLABLE | วันเวลาที่ลบ (Soft Delete) |
| 15 | `deleted_by` | VARCHAR(100) | ✅ NULLABLE | ชื่อผู้ลบ |

**Indexes:**
- `idx_banners_active_date` ON `(is_active, start_date, end_date)`
- `idx_banners_sort` ON `(sort_order)`

---

## 📎 ตาราง: `uploads`

> ตารางสำหรับเก็บข้อมูลการอัปโหลดไฟล์ทุกประเภท — รองรับการเชื่อมโยงกับตารางอื่นผ่าน `ref_table` / `ref_id`

| # | Column Name | Data Type | Flags | คำอธิบาย |
|---|-------------|-----------|-------|---------|
| 1 | `id` | SERIAL | 🔑 PK, ❗ NOT NULL | รหัสไฟล์ Primary Key (Auto Increment) |
| 2 | `original_name` | VARCHAR(255) | ❗ NOT NULL | ชื่อไฟล์ต้นฉบับที่ผู้ใช้ส่งมา |
| 3 | `saved_name` | VARCHAR(255) | ❗ NOT NULL | ชื่อไฟล์ที่บันทึกจริงในระบบ (มักเป็น UUID หรือ timestamp) |
| 4 | `path` | VARCHAR(2000) | ❗ NOT NULL | พาธไฟล์ที่บันทึก เช่น `/uploads/banners/xxx.jpg` |
| 5 | `mime_type` | VARCHAR(100) | ✅ NULLABLE | ประเภทไฟล์ตามมาตรฐาน MIME เช่น `image/jpeg`, `application/pdf` |
| 6 | `size` | BIGINT | ✅ NULLABLE | ขนาดไฟล์ หน่วยเป็น bytes |
| 7 | `extension` | VARCHAR(20) | ✅ NULLABLE | นามสกุลไฟล์ เช่น `.jpg`, `.png`, `.pdf` |
| 8 | `ref_table` | VARCHAR(50) | ✅ NULLABLE, 📇 IDX | ชื่อตารางที่ผูกไว้ เช่น `users`, `banners` |
| 9 | `ref_id` | INTEGER | ✅ NULLABLE, 📇 IDX | ID ของ record ที่ผูกไว้ เช่น `user_id = 2` |
| 10 | `tag` | VARCHAR(50) | ✅ NULLABLE | ประเภทการใช้งานไฟล์ เช่น `avatar`, `banner`, `document` |
| 11 | `sort_order` | INTEGER | 🔵 DEFAULT 1 | ลำดับการแสดงผล (กรณีมีหลายไฟล์ต่อ 1 record) |
| 12 | `is_temp` | SMALLINT | 🔵 DEFAULT 1, 📇 IDX | 1 = ไฟล์ชั่วคราว (ยังไม่ผูก), 0 = ไฟล์จริง |
| 13 | `is_active` | SMALLINT | 🔵 DEFAULT 1 | สถานะ (1 = ใช้งาน, 0 = ปิด) |
| 14 | `created_at` | TIMESTAMP | 🔵 DEFAULT NOW(), 📇 IDX | วันเวลาที่อัปโหลด |
| 15 | `created_by` | VARCHAR(100) | ✅ NULLABLE | ชื่อหรือ ID ผู้อัปโหลด |
| 16 | `deleted_at` | TIMESTAMP | ✅ NULLABLE | วันเวลาที่ลบ (Soft Delete) |
| 17 | `deleted_by` | VARCHAR(100) | ✅ NULLABLE | ชื่อผู้ที่ทำการลบไฟล์ |

**Indexes:**
- `idx_uploads_ref` ON `(ref_table, ref_id)`
- `idx_uploads_temp_cleanup` ON `(is_temp, created_at)`

---

## 📜 ตาราง: `audit_logs`

> ตารางเก็บ Log กลางสำหรับบันทึกประวัติการสร้าง แก้ไข หรือลบข้อมูลสำคัญทุกโมดูลในระบบ

| # | Column Name | Data Type | Flags | คำอธิบาย |
|---|-------------|-----------|-------|---------|
| 1 | `log_id` | SERIAL | 🔑 PK, ❗ NOT NULL | รหัส ID ของ Log แต่ละรายการ (Auto Increment) |
| 2 | `action_type` | VARCHAR(50) | ❗ NOT NULL | ประเภทกิจกรรม เช่น `CREATE`, `UPDATE`, `DELETE` |
| 3 | `module_name` | VARCHAR(100) | ❗ NOT NULL, 📇 IDX | ชื่อโมดูลหรือตารางที่ถูกแก้ไข เช่น `organizations`, `users` |
| 4 | `record_id` | VARCHAR(100) | ✅ NULLABLE, 📇 IDX | ID ของ record ที่ถูกกระทำ |
| 5 | `old_data` | JSONB | ✅ NULLABLE | ข้อมูลเดิมก่อนแก้ไข เก็บเป็น JSON เพื่อเปรียบเทียบย้อนหลัง |
| 6 | `new_data` | JSONB | ✅ NULLABLE | ข้อมูลใหม่หลังแก้ไข เก็บเป็น JSON |
| 7 | `remark` | TEXT | ✅ NULLABLE | หมายเหตุหรือเหตุผลการดำเนินการ (ส่งมาจากหน้าจอ) |
| 8 | `ip_address` | VARCHAR(45) | ✅ NULLABLE | IP Address ของ Client (รองรับทั้ง IPv4 และ IPv6) |
| 9 | `user_agent` | TEXT | ✅ NULLABLE | ข้อมูล Browser / Device ของ Client |
| 10 | `created_by` | INTEGER | ✅ NULLABLE | ID ของผู้ใช้งานที่ทำรายการ (อ้างอิง `users.user_id`) |
| 11 | `created_at` | TIMESTAMP | 🔵 DEFAULT NOW(), 📇 IDX | วันเวลาที่เกิดบันทึกกิจกรรม |

**Indexes:**
- `idx_audit_logs_module_record` ON `(module_name, record_id)`
- `idx_audit_logs_created_at` ON `(created_at)`

---

## 🔄 ความสัมพันธ์ระหว่างตาราง (Table Relationships)

```
users ─────────────────── user_roles ─────────── roles
  │                                                  │
  │                                           role_permissions
  │                                                  │
  ├──── user_organizations ─── organizations    permissions ─── permission_groups
  │                                  │
  │                        organization_permissions
  │
  ├──── user_permissions ─── (org_id → organizations, permission_id → permissions)
  │
  └──── audit_logs (created_by)

banners ──── uploads (ref_table='banners', ref_id=banners.id)
users   ──── uploads (ref_table='users',   ref_id=users.user_id)
```

---

## 📋 Business Rules

### Soft Delete
ตารางที่รองรับ Soft Delete (ไม่ลบข้อมูลจริง):
- `banners` — ใช้ `deleted_at` / `deleted_by`
- `uploads` — ใช้ `deleted_at` / `deleted_by`
- `roles` — ใช้ `is_active = 0`
- `organizations` — ใช้ `is_active = 0`

### Permission Priority (ลำดับความสำคัญของสิทธิ์)
```
user_permissions (is_deny=1)  ← สูงสุด (Deny Override)
       ↓
user_permissions (is_deny=0)  ← สิทธิ์พิเศษบุคคล
       ↓
organization_permissions      ← สิทธิ์ระดับหน่วยงาน
       ↓
role_permissions              ← สิทธิ์ระดับ Role
```

### Temp File Lifecycle (uploads)
- `is_temp = 1` → ไฟล์ที่เพิ่งอัปโหลด ยังไม่ผูกกับ record
- `is_temp = 0` → ไฟล์ที่ผูกกับ record แล้ว (มี `ref_table` และ `ref_id`)
- ไฟล์ที่ `is_temp = 1` นานเกินกำหนดควรถูก cleanup ผ่าน `idx_uploads_temp_cleanup`

---

*สร้างเมื่อ: พฤษภาคม 2026 | DCCE Backend — PostgreSQL*
