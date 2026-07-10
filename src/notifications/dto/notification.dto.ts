import { ApiProperty } from '@nestjs/swagger';

export class CreateNotificationDto {
  @ApiProperty({ description: 'หัวข้อแจ้งเตือน' })
  title: string;

  @ApiProperty({ description: 'รายละเอียดแจ้งเตือน', required: false })
  message?: string;

  @ApiProperty({ description: 'ประเภทแจ้งเตือน (INFO, SUCCESS, WARNING, ERROR)', default: 'INFO' })
  type?: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';

  @ApiProperty({ description: 'URL ปลายทางเมื่อคลิก Noti', required: false })
  action_url?: string;

  @ApiProperty({ description: 'ข้อมูลเสริมเพิ่มเติม (JSON)', required: false })
  payload?: any;

  @ApiProperty({ description: 'ตารางต้นทางที่อ้างอิง', required: false })
  ref_table?: string;

  @ApiProperty({ description: 'ID ข้อมูลต้นทาง', required: false })
  ref_id?: string;

  @ApiProperty({ description: 'ผู้ส่งแจ้งเตือน', required: false })
  sender_id?: string;

  @ApiProperty({ description: 'กลุ่มผู้ใช้งานเป้าหมาย (Role)', required: false })
  target_role?: string;

  @ApiProperty({ description: 'ผู้ใช้งานเป้าหมายเจาะจง (User ID)', required: false })
  target_user_id?: string;

  @ApiProperty({ description: 'ผู้ใช้งานเป้าหมายหลายคน (User IDs)', required: false })
  target_user_ids?: string[];
}
