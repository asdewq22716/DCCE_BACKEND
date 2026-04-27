# NestJS Essential Cheat Sheet (สรุปสิ่งที่ต้องรู้)

รวม Decorators และคำสั่งที่ใช้บ่อยใน NestJS สำหรับมือใหม่

---

## 1. การประกาศ Class หลัก
*   **`@Module()`**: ใช้บนหัว Class ในไฟล์ `.module.ts` (กั้นห้องครัว)
*   **`@Controller('path')`**: ใช้บนหัว Class ในไฟล์ `.controller.ts` (ระบุ URL หน้าบ้าน)
*   **`@Injectable()`**: ใช้บนหัว Class ในไฟล์ `.service.ts` (คนทำงาน)

---

## 2. การรับข้อมูลจากลูกค้า (Request Decorators)
ใช้เขียนในวงเล็บของฟังก์ชันใน Controller

| Decorator | หน้าที่ | ใช้ที่ไหน / ตัวอย่าง |
| :--- | :--- | :--- |
| **`@Query('key')`** | ดึงค่าจากท้าย URL หลัง `?` | ในวงเล็บฟังก์ชัน (Controller) |
| **`@Param('id')`** | ดึงค่าจาก Path `/5` | ในวงเล็บฟังก์ชัน (Controller) |
| **`@Body()`** | ดึง JSON ที่ส่งมา | ในวงเล็บฟังก์ชัน (Controller) |
| **`@Headers('key')`** | ดึงค่าจาก Header | ในวงเล็บฟังก์ชัน (Controller) |

---

## 3. การระบุ Method (HTTP Methods)
เขียนไว้บนหัวฟังก์ชันใน Controller

เขียนไว้ **บนหัวฟังก์ชัน** ใน Controller

*   **`@Get()`**: อ่านข้อมูล (URL ปกติ)
*   **`@Post()`**: สร้างข้อมูลใหม่ (ส่ง JSON มา)
*   **`@Put()` / `@Patch()`**: แก้ไขข้อมูล
*   **`@Delete()`**: ลบข้อมูล

---

## 4. ส่วนประกอบใน @Module
*   **`imports`**: นำเอา Module อื่นมาใช้ในห้องครัวเรา
*   **`controllers`**: ระบุว่าในห้องครัวนี้มีพนักงานรับออเดอร์คนไหนบ้าง
*   **`providers`**: ระบุว่าในห้องครัวนี้มีใครทำงาน (Service) บ้าง
*   **`exports`**: อนุญาตให้คนอื่นยืม Service ของเราไปใช้ได้

---

## 5. การฉีด Dependency Injection (DI)
ใช้ใน `constructor` เพื่อขอเครื่องมือหรือ Service มาใช้งาน

```typescript
constructor(
  private readonly productsService: ProductsService, // ขอใช้ Service ในบ้าน
  private readonly authService: AuthService          // ขอใช้ Service จากนอกบ้าน (ที่ import มา)
) {}
```

---

## 7. การทำคู่มือ API (Swagger Decorators)
ใช้สำหรับทำให้หน้า `http://localhost:3000/api` ดูง่ายและสวยงาม

*   **`@ApiTags('ชื่อหมวด')`**: บนหัว Class (Controller)
*   **`@ApiOperation({ summary: '...' })`**: บนหัวฟังก์ชัน (Controller)
*   **`@ApiProperty({ example: '...' })`**: ใน Class (DTO)
*   **`@ApiQuery({ name: '...' })`**: บนหัวฟังก์ชัน (Controller)

---

## 8. เคล็ดลับเพิ่มเติม
*   ถ้าอยากให้ระบบตรวจสอบข้อมูลอัตโนมัติ (เช่น ต้องไม่เป็นค่าว่าง) ให้ใช้ `class-validator` ร่วมกับ **DTO**
*   การใช้ `private readonly` ใน constructor คือการประกาศตัวแปรและรับค่ามาใช้งานในบรรทัดเดียวกัน (ย่อโค้ดให้สั้นลง)
