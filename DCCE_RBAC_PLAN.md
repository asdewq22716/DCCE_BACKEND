# 🚀 DCCE RBAC Permission System - Roadmap

ไฟล์นี้สรุปแผนการพัฒนาสถาปัตยกรรมระบบสิทธิ์ (RBAC) สำหรับโปรเจกต์ DCCE
*สถานะล่าสุด: เตรียม Database Schema และแผนงานเรียบร้อยแล้ว*

---

## 📅 แผนการพัฒนา (Phased Roadmap)

### Phase 1: Roles CRUD (บทบาท)
- [ ] สร้าง `RolesModule` ใหม่
- [ ] API สำหรับ เพิ่ม/ดู/แก้ไข/ลบ บทบาท (เช่น ADMIN, EDITOR, VIEWER)
- [ ] ตรวจสอบความปลอดภัย: ห้ามลบ Role ที่มีผู้ใช้งานค้างอยู่

### Phase 2: Role ↔ Permissions (ผูกสิทธิ์กับบทบาท)
- [ ] API สำหรับดึงสิทธิ์ทั้งหมดที่ Role นั้นมี
- [ ] API สำหรับบันทึกการเลือกสิทธิ์แบบ Checkbox Matrix (Assign Permissions)
- [ ] ใช้เทคนิค **Delete All → Insert All** ภายใน Transaction เพื่อความแม่นยำ

### Phase 3: User Management (จัดการผู้ใช้)
- [ ] API ค้นหาผู้ใช้ (Search Users)
- [ ] API มอบบทบาทให้ผู้ใช้ (Assign Roles to User)
- [ ] API จัดการสิทธิ์พิเศษรายบุคคล (Override Permissions: Grant/Deny)
- [ ] รองรับการกำหนดวันหมดอายุของสิทธิ์ (Expired At)

### Phase 4: Effective Permissions (คำนวณสิทธิ์จริง)
- [ ] API คำนวณสิทธิ์สุทธิของ User (สิทธิ์จาก Role + สิทธิ์พิเศษ - สิทธิ์ที่ถูก Deny)
- [ ] **กฎเหล็ก:** `is_deny = 1` จะชนะทุกกรณี (Deny Always Wins)
- [ ] พัฒนา Guard/Middleware เพื่อใช้ตรวจสิทธิ์ใน API อื่นๆ

---

## 🎨 UI Design (Wireframes)

รายละเอียดการออกแบบหน้าจอทั้ง 4 หน้า สามารถดูได้ใน Artifact:
`permission_workflow.md`

1. **หน้าจัดการสิทธิ์:** (เสร็จแล้ว) CRUD Permission & Groups
2. **หน้าจัดการบทบาท:** Role List + Checkbox Matrix
3. **หน้าจัดการผู้ใช้:** User List + Role Assignment + Override Table
4. **หน้าตรวจสอบ:** Debug view ดูว่าสิทธิ์ไหนมาจากแหล่งไหน

---

## 🗄️ Database Structure

ตารางที่เกี่ยวข้องทั้งหมด (9 ตาราง):

**กลุ่มที่ 1: โครงสร้างองค์กรและบุคคล**
1. `organizations` - ผังองค์กร (สาขา, กรม) โครงสร้างแบบต้นไม้
2. `users` - ข้อมูลผู้ใช้
3. `user_organizations` - เชื่อมผู้ใช้กับองค์กร (1 คนสังกัดได้หลายกรม)

**กลุ่มที่ 2: ระบบจัดการสิทธิ์ (Master Data)**
3. `permission_groups` - กลุ่มของสิทธิ์
4. `permissions` - นิยามสิทธิ์ย่อย (Key)

**กลุ่มที่ 3: ระบบบทบาท (Roles & Mapping)**
5. `roles` - นิยามบทบาท (เช่น หัวหน้า, พนักงาน)
6. `role_permissions` - เชื่อมบทบาทกับสิทธิ์ (Role ↔ Permissions)
7. `user_roles` - เชื่อมผู้ใช้กับบทบาท (User ↔ Roles)
8. `user_permissions` - สิทธิ์พิเศษรายบุคคล (Override: Grant/Deny)

---

## 🛠️ คำสั่งสำหรับเริ่มทำต่อ
เมื่อเปิดแชทใหม่ ให้บอก AI ว่า: 
> "อ่านไฟล์ `DCCE_RBAC_PLAN.md` แล้วเริ่มทำต่อที่ **Phase 1: Roles CRUD** ได้เลย"

---

## 📂 ที่เก็บไฟล์ข้อมูลเพิ่มเติม (Artifacts)
หากต้องการดูรายละเอียดเชิงลึก (UI Wireframe / Sequence Diagram) ไฟล์จะอยู่ที่:
`C:\Users\asdew\.gemini\antigravity\brain\d650857f-6a97-4e30-9ca8-cf12bdb8bc3b\`
1. `implementation_plan.md` - แผนการเขียน Code แบบละเอียด
2. `permission_workflow.md` - การออกแบบ UI และ Flow การทำงาน
3. `analysis_results.md` - ผลการวิเคราะห์ Schema ล่าสุด

และไฟล์สถาปัตยกรรมล่าสุด (Organization & RBAC) อยู่ที่:
`C:\Users\asdew\.gemini\antigravity\brain\e415aaef-4ff1-4226-bada-05be6e4a8b0b\`
4. `rbac_architecture_guide.md` - สถาปัตยกรรม 9 ตาราง (สาขา, กรม, บทบาท)
