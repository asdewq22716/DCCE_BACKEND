export const SyncPermissionsExamples = {
  '1. สร้างข้อมูลใหม่ (Create)': {
    summary: 'สร้างกลุ่มและสิทธิ์ตามดีไซน์ UI (รายงาน, ระบบจัดการผู้ใช้)',
    value: {
      children: [
        {
          group_name: 'รายงาน',
          sort_order: 1,
          permissions: [
            { p_key: 'report.view', p_label: 'ดู' },
            { p_key: 'report.add', p_label: 'เพิ่ม' },
            { p_key: 'report.edit', p_label: 'แก้ไข' },
            { p_key: 'report.delete', p_label: 'ลบ' },
            { p_key: 'report.download', p_label: 'ดาวน์โหลด' }
          ]
        },
        {
          group_name: 'ระบบจัดการผู้ใช้',
          sort_order: 2,
          permissions: [],
          children: [
            {
              group_name: 'สิทธิ์ตามหน่วยงาน',
              sort_order: 1,
              permissions: [
                { p_key: 'user.org.view', p_label: 'ดู' },
                { p_key: 'user.org.add', p_label: 'เพิ่ม' },
                { p_key: 'user.org.edit', p_label: 'แก้ไข' },
                { p_key: 'user.org.delete', p_label: 'ลบ' },
                { p_key: 'user.org.download', p_label: 'ดาวน์โหลด' }
              ]
            },
            {
              group_name: 'สิทธิ์ตามบทบาทผู้ใช้งาน',
              sort_order: 2,
              permissions: [
                { p_key: 'user.role.view', p_label: 'ดู' },
                { p_key: 'user.role.add', p_label: 'เพิ่ม' },
                { p_key: 'user.role.edit', p_label: 'แก้ไข' },
                { p_key: 'user.role.delete', p_label: 'ลบ' },
                { p_key: 'user.role.download', p_label: 'ดาวน์โหลด' }
              ]
            }
          ]
        }
      ]
    }
  },
  '2. แก้ไขข้อมูลเก่า (Update)': {
    summary: 'เปลี่ยนชื่อกลุ่มและชื่อสิทธิ์ (ต้องแนบ ID ของเก่ามาด้วย)',
    value: {
      children: [
        {
          group_id: 1,
          group_name: 'ระบบรายงาน (แก้ชื่อใหม่)',
          permissions: [
            { permission_id: 10, p_key: 'report.view', p_label: 'ดูรายงาน (แก้ชื่อ)' }
          ]
        }
      ]
    }
  },
  '3. ลบข้อมูลทิ้ง (Delete)': {
    summary: 'ส่งแค่ ID ไปให้ Backend สั่งลบทิ้ง',
    value: {
      children: [],
      deleted_groups: [5, 6],
      deleted_permissions: [12]
    }
  },
  '4. แบบผสมผสาน (Sync All)': {
    summary: 'แก้ของเก่า, สร้างของใหม่, ลบทิ้ง พร้อมกันในคลิกเดียว',
    value: {
      children: [
        {
          group_id: 1,
          group_name: 'ระบบรายงาน (แก้ไข)',
          permissions: [
            { permission_id: 10, p_key: 'report.view', p_label: 'ดูข้อมูล' },
            { p_key: 'report.export', p_label: 'สิทธิ์ใหม่เพิ่งสร้าง (ไม่ใส่ ID)' }
          ]
        }
      ],
      deleted_groups: [2]
    }
  },
  '5. Seed ข้อมูลตั้งต้น (ทั้งหมดตาม UI)': {
    summary: 'สร้างโครงสร้างสิทธิ์ทั้งหมดตามดีไซน์ UI (สำหรับ Developer ใช้สร้างฐานข้อมูลเริ่มต้น)',
    value: {
      children: [
        {
          group_name: 'รายงาน',
          sort_order: 1,
          permissions: [
            { p_key: 'report.view', p_label: 'ดู' },
            { p_key: 'report.add', p_label: 'เพิ่ม' },
            { p_key: 'report.edit', p_label: 'แก้ไข' },
            { p_key: 'report.delete', p_label: 'ลบ' },
            { p_key: 'report.download', p_label: 'ดาวน์โหลด' }
          ]
        },
        {
          group_name: 'ระบบจัดการผู้ใช้',
          sort_order: 2,
          permissions: [],
          children: [
            {
              group_name: 'สิทธิ์ตามหน่วยงาน',
              sort_order: 1,
              permissions: [
                { p_key: 'user.org.view', p_label: 'ดู' },
                { p_key: 'user.org.add', p_label: 'เพิ่ม' },
                { p_key: 'user.org.edit', p_label: 'แก้ไข' },
                { p_key: 'user.org.delete', p_label: 'ลบ' },
                { p_key: 'user.org.download', p_label: 'ดาวน์โหลด' }
              ]
            },
            {
              group_name: 'สิทธิ์ตามบทบาทผู้ใช้งาน',
              sort_order: 2,
              permissions: [
                { p_key: 'user.role.view', p_label: 'ดู' },
                { p_key: 'user.role.add', p_label: 'เพิ่ม' },
                { p_key: 'user.role.edit', p_label: 'แก้ไข' },
                { p_key: 'user.role.delete', p_label: 'ลบ' },
                { p_key: 'user.role.download', p_label: 'ดาวน์โหลด' }
              ]
            },
            {
              group_name: 'จัดการสิทธิ์บุคคลภายนอก',
              sort_order: 3,
              permissions: [
                { p_key: 'user.external.view', p_label: 'ดู' },
                { p_key: 'user.external.add', p_label: 'เพิ่ม' },
                { p_key: 'user.external.edit', p_label: 'แก้ไข' },
                { p_key: 'user.external.delete', p_label: 'ลบ' },
                { p_key: 'user.external.download', p_label: 'ดาวน์โหลด' }
              ]
            },
            {
              group_name: 'จัดการ Service ของระบบ',
              sort_order: 4,
              permissions: [
                { p_key: 'user.service.view', p_label: 'ดู' },
                { p_key: 'user.service.add', p_label: 'เพิ่ม' },
                { p_key: 'user.service.edit', p_label: 'แก้ไข' },
                { p_key: 'user.service.delete', p_label: 'ลบ' },
                { p_key: 'user.service.download', p_label: 'ดาวน์โหลด' }
              ]
            },
            {
              group_name: 'ประวัติการเปลี่ยนแปลง',
              sort_order: 5,
              permissions: [
                { p_key: 'user.history.view', p_label: 'ดู' },
                { p_key: 'user.history.add', p_label: 'เพิ่ม' },
                { p_key: 'user.history.edit', p_label: 'แก้ไข' },
                { p_key: 'user.history.delete', p_label: 'ลบ' },
                { p_key: 'user.history.download', p_label: 'ดาวน์โหลด' }
              ]
            }
          ]
        }
      ]
    }
  }
};
