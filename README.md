# 🚀 DCCE Backend - NestJS 101 Notes

โปรเจ็คนี้เริ่มต้นขึ้นเพื่อเรียนรู้ NestJS โดยเน้นความเป็นระเบียบและ Type Safety ระดับปานกลาง (Medium-Strict)

## 📌 วิธีเริ่มใช้งาน (Quick Start)
1. ติดตั้ง Dependencies:
   ```bash
   npm install
   ```
2. รันโปรเจ็คในโหมดพัฒนา:
   ```bash
   npm run dev
   ```
3. เข้าดูคู่มือ API (Swagger):
   👉 [http://localhost:3000/api](http://localhost:3000/api)

---

## 🎓 บทเรียนที่เรียนรู้ไปแล้ว

### 1. โครงสร้างพื้นฐาน (The Three Pillars)
- **Module**: ตัวมัดรวมความสัมพันธ์ของ Controller และ Service เข้าด้วยกัน
- **Controller**: พนักงานหน้าด่าน รับ HTTP Request (GET, POST...) และส่งงานต่อให้ Service
- **Service**: สมองของระบบ จัดการ Logic ทั้งหมด (ในอนาคตจะใช้เขียน Raw SQL ตรงนี้)

### 2. DTO (Data Transfer Object)
- คือ "แบบฟอร์ม" หรือ "สัญญา" ที่กำหนดหน้าตาข้อมูลที่ส่งไปมาระหว่าง User กับ Server
- การใส่ `@ApiProperty()` ช่วยให้ Swagger แสดงตัวอย่างข้อมูลที่ต้องส่งได้อัตโนมัติ

### 3. Validation (การตรวจสอบข้อมูล) 🛡️
- ใช้ `class-validator` และ `class-transformer`
- ต้องเปิดใช้งานใน `main.ts` ด้วย `app.useGlobalPipes(new ValidationPipe())`
- ช่วยให้เราใส่กฎ เช่น `@IsString()`, `@Min(0)`, `@IsNotEmpty()` ได้ในไฟล์ DTO

### 4. คำสั่งที่มีประโยชน์
- **สร้าง Module ใหม่แบบไม่มีไฟล์ทดสอบ**:
  ```bash
  npx nest generate resource [name] --no-spec
  ```
- **ลบไฟล์ .spec ทั้งหมด**:
  ```powershell
  Remove-Item -Path "src/**/*.spec.ts" -Recurse -Force
  ```

---

## 🛠️ Tech Stack หลักในตอนนี้
- **NestJS** (v11)
- **TypeScript** (Medium-Strict config)
- **Swagger** (API Documentation)
- **Validation** (class-validator)

---
*บันทึกไว้สำหรับย้ายไปใช้งานที่เครื่องหลัก - ขอให้สนุกกับการเขียน NestJS ครับ!*

---

## 🗄️ Database Schema Design (RBAC)

ลำดับ | ชื่อตาราง | หน้าที่หลัก | ฟิลด์ที่จำเป็น (Fields)
:--- | :--- | :--- | :---
1 | **Organizations** | เก็บโครงสร้าง ส่วนงาน > กรม | `id, name, parent_id, type`
2 | **Users** | ข้อมูลผู้ใช้งาน | `id, username, full_name, org_id (FK), user_type, is_active, last_login, sso_*`
3 | **Roles** | ตำแหน่ง/บทบาทงาน | `id, role_name, description`
4 | **Permissions** | นิยามสิทธิ์ (กุญแจ) | `id, p_key, p_label, p_group`
5 | **UserRoles** | ใครนั่งตำแหน่งไหน | `user_id, role_id`
6 | **RolePermissions** | ตำแหน่งนี้มีสิทธิ์อะไร | `role_id, permission_id`
7 | **UserPermissions** | สิทธิ์พิเศษรายบุคคล | `user_id, permission_id, expired_at, remark`

---

## 🔍 วิเคราะห์: `user_sso` vs `Users`

จากการวิเคราะห์โครงสร้างปัจจุบันและที่ออกแบบใหม่ พบว่ามีความสัมพันธ์กันดังนี้:

### 1. สามารถใช้แทนกันได้หรือไม่?
**คำตอบ: ควรยุบรวมกัน (Merge)**
ในระบบปัจจุบัน `user_sso` ทำหน้าที่เป็นตารางเก็บข้อมูลผู้ใช้งานหลักที่ Sync มาจาก SSO อยู่แล้ว ดังนั้นควรใช้ตาราง `Users` เป็นตัวหลักเพียงตารางเดียว เพื่อลดความซ้ำซ้อนของข้อมูล (Data Redundancy)

### 2. ฟิลด์ที่ควรเพิ่มหรือปรับปรุง
หากจะเปลี่ยนจาก `user_sso` มาเป็น `Users` ควรมีโครงสร้างดังนี้:

- **ฟิลด์จาก SSO ที่ต้องรักษาไว้:**
  - `id` (ใช้ `userid` จาก SSO เป็น Primary Key)
  - `username`
  - `email`, `prefix_name`, `firstname`, `lastname` (สำหรับออกเอกสาร)
  - `is_active`, `last_login` (สำหรับตรวจสอบสถานะการใช้งาน)

- **ฟิลด์ที่ต้องเพิ่มตามที่ออกแบบใหม่:**
  - `org_id` (FK): เชื่อมไปยังตาราง `Organizations` (โดย Mapping จาก `work_place_id` หรือ `division_id` ของ SSO)
  - `user_type`: เพื่อแยกระหว่างบุคคลภายใน (Internal) และภายนอก (External)
  - `full_name`: สามารถเก็บเป็นฟิลด์เดี่ยว หรือใช้ Virtual Field จาก `firstname + lastname` ก็ได้

### 3. ข้อเสนอแนะการจัดการ Organization
ตาราง `Organizations` ควรถูกออกแบบให้รองรับ Hierarchy โดยใช้ `parent_id` ซึ่งสามารถ Map ข้อมูลจาก SSO ได้ดังนี้:
- `work_place_id` -> กรม/หน่วยงานหลัก
- `division_id` -> กอง/ส่วน
- `sub_division_id` -> ฝ่าย/กลุ่มงาน

การทำเช่นนี้จะทำให้ระบบ RBAC มีความยืดหยุ่นสูงและจัดการสิทธิ์ตามโครงสร้างองค์กรได้แม่นยำครับ

---

## 📄 SQL Scripts
สามารถดูคำสั่ง SQL สำหรับสร้าง Table ทั้งหมดได้ที่: [schema.sql](file:///e:/git/Newdice/DCCE/DCCE_BACKEND/sql/schema.sql)

