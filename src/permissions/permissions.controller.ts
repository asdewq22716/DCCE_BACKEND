import { Controller, Get, Put, Body, Post, Param, ParseIntPipe, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody, ApiParam } from '@nestjs/swagger';
import { PermissionsService } from './permissions.service';
import { SyncPermissionsDto } from './dto/sync-permissions.dto';
import { SyncPermissionsExamples } from './dto/sync-permissions.examples';
import { BulkUpdateUserOrgPermissionsDto } from './dto/user-org-permissions.dto';
import { FncCustom } from 'src/common/fnc-custom';

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
  syncPermissions(@Req() req: any, @Body() dto: SyncPermissionsDto) {
    const context = FncCustom.getAuditContext(req);
    return this.permissionsService.syncPermissions(dto, context);
  }

  @Get('users/:userId/orgs')
  @ApiOperation({ summary: 'ดึงรายการสิทธิ์ทั้งหมดของ User แยกตามหน่วยงาน (ดึงเฉพาะที่ถูก Override ไว้)' })
  @ApiParam({ name: 'userId', type: 'number' })
  getUserAllOrgPermissions(
    @Param('userId', ParseIntPipe) userId: number,
  ) {
    return this.permissionsService.getUserAllOrgPermissions(userId);
  }

  @Get('users/:userId/orgs/:orgId')
  @ApiOperation({ summary: 'ดึงรายการสิทธิ์ของ User ในบริบทของหน่วยงาน' })
  @ApiParam({ name: 'userId', type: 'number' })
  @ApiParam({ name: 'orgId', type: 'number' })
  getUserOrgPermissions(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('orgId', ParseIntPipe) orgId: number,
  ) {
    return this.permissionsService.getUserOrgPermissions(userId, orgId);
  }

  @Post('users/:userId/orgs')
  @ApiOperation({ summary: 'บันทึกสิทธิ์แบบกำหนดเอง (Override) หลายหน่วยงานพร้อมกันทีเดียว' })
  @ApiParam({ name: 'userId', type: 'number' })
  saveAllUserOrgPermissions(
    @Req() req: any,
    @Param('userId', ParseIntPipe) userId: number,
    @Body() dto: BulkUpdateUserOrgPermissionsDto,
  ) {
    const context = FncCustom.getAuditContext(req);
    return this.permissionsService.saveAllUserOrgPermissions(userId, dto, context);
  }
}
