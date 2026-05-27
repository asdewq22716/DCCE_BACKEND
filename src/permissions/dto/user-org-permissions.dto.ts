import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNumber, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class OrgPermissionItemDto {
  @ApiProperty({ description: 'ID ของหน่วยงาน', example: 1 })
  @IsNumber()
  org_id: number;

  @ApiProperty({
    description: 'รายการ ID ของสิทธิ์ย่อยที่ถูกเลือก (ติ๊กถูก) ในหน่วยงานนี้',
    type: [Number],
    example: [1, 2, 5],
  })
  @IsArray()
  @IsNumber({}, { each: true })
  permissionIds: number[];
}

export class BulkUpdateUserOrgPermissionsDto {
  @ApiProperty({
    description: 'ข้อมูลสิทธิ์แยกตามแต่ละหน่วยงานที่ต้องการบันทึก',
    type: [OrgPermissionItemDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrgPermissionItemDto)
  orgPermissions: OrgPermissionItemDto[];

  @ApiProperty({ description: 'สถานะการใช้งาน (1 = เปิด, 0 = ปิด, 2 = ถูกบล็อก)', example: 1, required: false })
  @IsNumber()
  permission_status?: number;

  @ApiProperty({ description: 'หมายเหตุการบล็อกหรือปิดการใช้งาน', example: 'พ้นสภาพพนักงาน', required: false })
  permission_remark?: string;
}
