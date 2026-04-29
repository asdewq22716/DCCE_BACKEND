import { ApiProperty } from '@nestjs/swagger';

export class SsoBaseResponse<T> {
  @ApiProperty({ description: 'รหัสผลลัพธ์' })
  result_code: string;

  @ApiProperty({ description: 'ข้อความผลลัพธ์' })
  result_text: string;

  result_data: T;

  @ApiProperty({ description: 'ข้อมูลหน่วยงาน', required: false })
  result_organize?: any;
}

export class SsoAuthData {
  @ApiProperty({ description: 'Token สำหรับยืนยันตัวตน' })
  token: string;

  @ApiProperty({ description: 'เลขบัตรประชาชน' })
  idcard_no: string;

  @ApiProperty({ description: 'อีเมลหลัก' })
  email: string;

  @ApiProperty({ description: 'ID ผู้ใช้งานจากระบบ SSO' })
  userid: string;

  @ApiProperty({ description: 'ชื่อบัญชีผู้ใช้งาน' })
  username: string;

  @ApiProperty({ description: 'คำนำหน้าชื่อ (เช่น นาย, นาง, นางสาว)' })
  prefix_name: string;

  @ApiProperty({ description: 'ชื่อภาษาไทย' })
  firstname: string;

  @ApiProperty({ description: 'นามสกุลภาษาไทย' })
  lastname: string;

  @ApiProperty({ description: 'ชื่อตำแหน่งงาน' })
  work_position_text: string;

  @ApiProperty({ description: 'รายละเอียดสถานที่ทำงาน' })
  work_place_text: string;

  @ApiProperty({ description: 'ID สถานที่ทำงาน' })
  work_place_id: string;

  @ApiProperty({ description: 'ชื่อสถานที่ทำงาน/หน่วยงาน' })
  work_place_name: string;

  @ApiProperty({ description: 'ID ประเภทสถานที่ทำงาน' })
  work_place_type_id: string;

  @ApiProperty({ description: 'ชื่อประเภทสถานที่ทำงาน' })
  work_place_type_name: string;

  @ApiProperty({ description: 'ID กอง/สำนัก' })
  division_id: string;

  @ApiProperty({ description: 'ชื่อกอง/สำนัก' })
  division_name: string;

  @ApiProperty({ description: 'ID ส่วน/กลุ่มงาน' })
  sub_division_id: string;

  @ApiProperty({ description: 'ชื่อส่วน/กลุ่มงาน' })
  sub_division_name: string;
}


export class SsoAuthDataReturn {
  @ApiProperty({ description: 'Token สำหรับยืนยันตัวตน' })
  sso_token: string;

  @ApiProperty({ description: 'เลขบัตรประชาชน' })
  sso_idcard_no: string;

  @ApiProperty({ description: 'อีเมลหลัก' })
  sso_email: string;

  @ApiProperty({ description: 'ID ผู้ใช้งานจากระบบ SSO' })
  sso_userid: string;

  @ApiProperty({ description: 'ชื่อบัญชีผู้ใช้งาน' })
  sso_username: string;

  @ApiProperty({ description: 'คำนำหน้าชื่อ (เช่น นาย, นาง, นางสาว)' })
  sso_prefix_name: string;

  @ApiProperty({ description: 'ชื่อภาษาไทย' })
  sso_firstname: string;

  @ApiProperty({ description: 'นามสกุลภาษาไทย' })
  sso_lastname: string;

  @ApiProperty({ description: 'ชื่อตำแหน่งงาน' })
  sso_work_position_text: string;

  @ApiProperty({ description: 'รายละเอียดสถานที่ทำงาน' })
  sso_work_place_text: string;

  @ApiProperty({ description: 'ID สถานที่ทำงาน' })
  sso_work_place_id: string;

  @ApiProperty({ description: 'ชื่อสถานที่ทำงาน/หน่วยงาน' })
  sso_work_place_name: string;

  @ApiProperty({ description: 'ID ประเภทสถานที่ทำงาน' })
  sso_work_place_type_id: string;

  @ApiProperty({ description: 'ชื่อประเภทสถานที่ทำงาน' })
  sso_work_place_type_name: string;

  @ApiProperty({ description: 'ID กอง/สำนัก' })
  sso_division_id: string;

  @ApiProperty({ description: 'ชื่อกอง/สำนัก' })
  sso_division_name: string;

  @ApiProperty({ description: 'ID ส่วน/กลุ่มงาน' })
  sso_sub_division_id: string;

  @ApiProperty({ description: 'ชื่อส่วน/กลุ่มงาน' })
  sso_sub_division_name: string;
}

export class SsoAuthResponseDto extends SsoAuthDataReturn {
  @ApiProperty({ description: 'PK ของ user' })
  user_id: number;

  @ApiProperty({ description: 'เข้าสู่ระบบล่าสุดเมื่อ' })
  last_login: Date;

  @ApiProperty({ description: 'สถานะการใช้งาน (1 = active, 0 = inactive)', enum: [0, 1] })
  is_active: 0 | 1;
}

