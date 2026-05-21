import { IsArray, IsInt, IsNotEmpty } from 'class-validator';

export class AssignPermissionsDto {
  @IsNotEmpty({ message: 'รายการสิทธิ์ไม่สามารถเป็นค่าว่างได้' })
  @IsArray({ message: 'รายการสิทธิ์ต้องส่งมาเป็น Array' })
  @IsInt({ each: true, message: 'รหัสสิทธิ์ (Permission ID) ต้องเป็นตัวเลขจำนวนเต็ม' })
  permissionIds: number[];
}
