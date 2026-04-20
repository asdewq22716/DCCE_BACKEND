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
