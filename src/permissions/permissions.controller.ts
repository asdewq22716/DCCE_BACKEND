import { Controller, Get, Put, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger';
import { PermissionsService } from './permissions.service';
import { SyncPermissionsDto } from './dto/sync-permissions.dto';
import { SyncPermissionsExamples } from './dto/sync-permissions.examples';

@ApiTags('Permissions')
@Controller('permissions')
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Get('tree')
  @ApiOperation({ summary: 'ดึงโครงสร้างสิทธิ์และกลุ่มทั้งหมด (รูปแบบ Hierarchy/Tree)' })
  getPermissionsTree() {
    return this.permissionsService.getPermissionsTree();
  }

  @Put('sync')
  @ApiOperation({ summary: 'บันทึก/แก้ไข/ลบ โครงสร้างสิทธิ์ทั้งหมดแบบรวดเดียวจบ (Bulk Upsert)' })
  @ApiBody({
    type: SyncPermissionsDto,
    examples: SyncPermissionsExamples
  })
  syncPermissions(@Body() dto: SyncPermissionsDto) {
    return this.permissionsService.syncPermissions(dto);
  }
}
