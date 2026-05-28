# DCCE Backend - Permissions Flow (ระบบสิทธิ์การใช้งาน)

เอกสารนี้อธิบายการทำงานของระบบสิทธิ์การใช้งาน (Role-Based & Contextual Permissions) ที่ใช้งานอยู่ภายใน DCCE Backend โดยครอบคลุมทั้งเรื่องโครงสร้างฐานข้อมูล, กระบวนการดึงสิทธิ์ (Get Permissions), และกระบวนการบันทึกสิทธิ์ (Save Permissions)

---

## 1. โครงสร้างฐานข้อมูลที่เกี่ยวข้อง (Database Architecture)

ระบบสิทธิ์ถูกออกแบบมาให้รองรับทั้งสิทธิ์ระดับองค์กร (Global) และสิทธิ์ระดับหน่วยงานย่อย (Organization Context) โดยมีตารางที่เกี่ยวข้องหลักๆ ดังนี้:

- **`users`**: ตารางเก็บข้อมูลผู้ใช้งาน มีฟิลด์ `permission_status` ไว้สำหรับเปิด/ปิด/ระงับการใช้งานระบบ
- **`permissions`**: ตารางเก็บสิทธิ์พื้นฐานย่อยๆ ทั้งหมดของระบบ (Atomic Permissions) เช่น `user.view`, `report.export`
- **`roles` / `user_roles` / `role_permissions`**: กลุ่มตารางสำหรับจัดการ **Global Permissions** (สิทธิ์ที่ผูกกับบทบาทหลัก เช่น แอดมิน, ผู้บริหาร)
- **`organizations` / `user_organizations`**: ตารางเก็บข้อมูลหน่วยงาน และการผูกสังกัดหน่วยงานหลักของผู้ใช้งาน
- **`organization_permissions`**: สิทธิ์พื้นฐาน (Base Permissions) ที่แต่ละหน่วยงานจะได้รับโดย Default
- **`user_permissions`**: ตารางสำคัญที่สุดสำหรับระบบ **Contextual Override** ใช้เก็บสิทธิ์พิเศษรายบุคคลในแต่ละหน่วยงานย่อย โดยมีฟิลด์ `is_deny` ใช้ควบคุมว่าจะอนุญาต (0) หรือปฏิเสธ (1)

---

## 2. กระบวนการดึงสิทธิ์ผู้ใช้งาน (Fetch Effective Permissions)
**API Endpoint:** `GET /auth/me`
**Service Method:** `permissions.service.ts` -> `getEffectivePermissions(userId)`

เมื่อผู้ใช้งานเข้าสู่ระบบ (หรือหน้าบ้านยิงขอข้อมูล Profile) ระบบจะทำการคำนวณสิทธิ์ตามลำดับขั้นตอนต่อไปนี้:

1. **ตรวจสอบสถานะบัญชี (Account Status Check):**
   - ตรวจสอบ `permission_status` จากตาราง `users`
   - หากบัญชีถูกระงับ (ค่าไม่ใช่ `1`) ระบบจะตัดจบการทำงานและส่งค่าสิทธิ์เป็นว่างเปล่ากลับไปทันที (เพื่อความปลอดภัยสูงสุด)

2. **ดึงสิทธิ์ระดับสากล (Global Permissions):**
   - Query หาสิทธิ์ทั้งหมดที่ได้จาก `user_roles` 
   - สิทธิ์ในส่วนนี้จะถูกจัดเก็บไว้ใน `global_permissions: [...]` สำหรับการใช้งานระดับข้ามหน่วยงาน

3. **ค้นหาหน่วยงานทั้งหมด (Resolve Organizations):**
   - ระบบจะทำ Query `UNION` เพื่อหาหน่วยงานทั้งหมดที่ User คนนี้มีสิทธิ์เกี่ยวข้อง โดยดึงจาก 2 แหล่ง:
     - ก. ตาราง `user_organizations` (หน่วยงานหลักที่สังกัด)
     - ข. ตาราง `user_permissions` (หน่วยงานย่อยที่มีการกำหนดสิทธิ์พิเศษเอาไว้)

4. **คำนวณสิทธิ์ย่อยในแต่ละหน่วยงาน (Calculate Org Permissions):**
   - ระบบจะวนลูปหน่วยงานที่ได้จากข้อ 3 ทีละหน่วยงาน:
     1. **ดึง Base Permissions:** ดึงสิทธิ์ตั้งต้นจาก `organization_permissions`
     2. **ดึง Overrides:** ดึงสิทธิ์ที่ถูกปรับแต่งจาก `user_permissions`
     3. **ประกอบร่าง (Merge):** 
        - ถ้า `user_permissions` ระบุ `is_deny = 0` (ให้สิทธิ์) -> **เพิ่มเข้า Base**
        - ถ้า `user_permissions` ระบุ `is_deny = 1` (แบนสิทธิ์) -> **ลบออกจาก Base**
   - สิทธิ์สุทธิที่คำนวณเสร็จของแต่ละหน่วยงาน จะถูกนำไปบรรจุไว้ใน `organizations[].permissions` (โดยจะ **ไม่มี** global_permissions เข้ามาปะปนในชุดข้อมูลนี้)

---

## 3. กระบวนการบันทึกและแก้ไขสิทธิ์ (Save/Update Permissions)
**API Endpoint:** `POST /permissions/users/{userId}/orgs`
**Service Method:** `permissions.service.ts` -> `saveAllUserOrgPermissions(userId, dto, context)`

เมื่อแอดมินแก้ไขสิทธิ์ผู้ใช้งานในหน่วยงานย่อย ระบบทำงานด้วยแนวคิด **"Wipe and Replace (ล้างบางแล้วใส่ใหม่)"** ดังนี้:

1. **เตรียมการ (Preparation):**
   - อัปเดตสถานะการบล็อก/แบนบัญชีในตาราง `users` (ถ้ามีการส่งค่ามา)
   - ค้นหาและเตรียม `permission_id` ทั้งหมดที่ Active อยู่ในระบบ

2. **ล้างข้อมูลเดิม (Wipe):**
   - รันคำสั่ง `DELETE FROM user_permissions WHERE user_id = $1` เพื่อล้างค่า Override ทั้งหมดของ User คนนี้ทิ้ง (ลบทุกหน่วยงาน)

3. **บันทึกข้อมูลใหม่ (Replace):**
   - วนลูปหน่วยงานที่ส่งมาจาก Frontend (`dto.orgPermissions`)
   - ภายในแต่ละหน่วยงาน ระบบจะวนลูปย่อยกับ **สิทธิ์ทุกข้อในระบบ** (จากข้อ 1)
   - ทำการ Insert ลงตาราง `user_permissions`:
     - หากเป็นสิทธิ์ที่ถูกติ๊กเลือก (อยู่ใน `permissionIds`) -> บันทึก `is_deny = 0` (อนุญาต)
     - หากเป็นสิทธิ์ที่ **ไม่ได้ถูกเลือก** -> บันทึก `is_deny = 1` (สั่งแบนสิทธิ์นั้นในหน่วยงานนี้)
   - *หมายเหตุ:* ระบบจะไม่ไปยุ่งกับตาราง `user_organizations` (หน่วยงานหลัก) ในขั้นตอนนี้

4. **บันทึกประวัติ (Audit Log):**
   - บันทึกรายละเอียดการกระทำลงในระบบ Audit Log เพื่อการตรวจสอบย้อนหลัง

---

## 4. โครงสร้าง Response (Frontend Integration)

รูปแบบ JSON ที่ได้จากการยิงเส้น API `/auth/me` จะมีหน้าตาดังนี้:

```json
{
  "user": { ... },
  "roles": [ ... ],
  "organizations": [ 
    { "org_id": 1, "org_name": "กองเทคโนโลยีสารสนเทศ", "is_primary": 1 }
  ],
  "permissions": {
    "permission_status": 1,
    "permission_remark": null,
    "global_permissions": [
      "dashboard.view",
      "user.manage"
    ],
    "organizations": [
      {
        "org_id": 1,
        "org_name": "กองเทคโนโลยีสารสนเทศ",
        "permissions": [
          "report.view",
          "data.edit"
        ]
      },
      {
        "org_id": 2,
        "org_name": "หน่วยงานย่อย",
        "permissions": [
          "report.view"
        ]
      }
    ]
  }
}
```

- **`organizations` (root):** มาจากตาราง `user_organizations` คือหน่วยงานหลักที่สังกัด
- **`permissions.global_permissions`:** สิทธิ์หลักที่ใช้งานได้ทุกหนทุกแห่ง
- **`permissions.organizations`:** รายชื่อหน่วยงานทั้งหมดที่เข้าถึงได้ (หลัก + ย่อย) พร้อมกับสิทธิ์รายหน่วยงานที่ผ่านการคำนวณหักลบกลบหนี้เรียบร้อยแล้ว
