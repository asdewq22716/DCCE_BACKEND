export interface SsoBaseResponse<T> {
  result_code: string;
  result_text: string;
  result_data: T;
  result_organize?: any;
}

export interface SsoAuthData {
  token: string;              // Token สำหรับยืนยันตัวตน
  idcard_no: string;          // เลขบัตรประชาชน
  email: string;              // อีเมลหลัก
  userid: string;             // ID ผู้ใช้งานจากระบบ SSO
  username: string;           // ชื่อบัญชีผู้ใช้งาน
  prefix_name: string;        // คำนำหน้าชื่อ (เช่น นาย, นาง, นางสาว)
  firstname: string;          // ชื่อภาษาไทย
  lastname: string;           // นามสกุลภาษาไทย
  work_position_text: string; // ชื่อตำแหน่งงาน
  work_place_text: string;    // รายละเอียดสถานที่ทำงาน
  work_place_id: string;      // ID สถานที่ทำงาน
  work_place_name: string;    // ชื่อสถานที่ทำงาน/หน่วยงาน
  work_place_type_id: string; // ID ประเภทสถานที่ทำงาน
  work_place_type_name: string; // ชื่อประเภทสถานที่ทำงาน
  division_id: string;        // ID กอง/สำนัก
  division_name: string;      // ชื่อกอง/สำนัก
  sub_division_id: string;    // ID ส่วน/กลุ่มงาน
  sub_division_name: string;  // ชื่อส่วน/กลุ่มงาน
}

export interface SsoVerifyData {
  token: string;
  userid: string;
  username: string;
  firstname: string;
  lastname: string;
  email: string;
  division_name: string;
  work_place_name: string;
}
