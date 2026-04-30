import { Controller, Get, Post, Body, Param, Delete, ParseIntPipe, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { PermissionsService } from './permissions.service';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { CreatePermissionGroupDto } from './dto/create-permission-group.dto';

@ApiTags('Permissions')
@Controller('permissions')
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) { }

  @Post()
  @ApiOperation({ summary: 'สร้างสิทธิ์ใหม่' })
  createPermission(@Body() dto: CreatePermissionDto) {
    return this.permissionsService.createPermission(dto);
  }

  @Get()
  @ApiOperation({ summary: 'ดูรายการสิทธิ์ทั้งหมด' })
  getAllPermissions() {
    return this.permissionsService.getAllPermissions();
  }

  @Delete(':id')
  @ApiOperation({ summary: 'ลบสิทธิ์' })
  deletePermission(@Param('id', ParseIntPipe) id: number) {
    return this.permissionsService.deletePermission(id);
  }

  // ---------- Groups ----------

  @Post('groups')
  @ApiOperation({ summary: 'สร้างกลุ่มสิทธิ์ใหม่' })
  createGroup(@Body() dto: CreatePermissionGroupDto) {
    return this.permissionsService.createGroup(dto);
  }

  @Get('groups')
  @ApiOperation({ summary: 'ดูรายการกลุ่มสิทธิ์ทั้งหมด' })
  getAllGroups() {
    return this.permissionsService.getAllGroups();
  }

  @Delete('groups/:id')
  @ApiOperation({ summary: 'ลบกลุ่มสิทธิ์' })
  deleteGroup(@Param('id', ParseIntPipe) id: number) {
    return this.permissionsService.deleteGroup(id);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'ดูสิทธิ์ทั้งหมดของผู้ใช้งาน (รวมจาก Role และสิทธิ์พิเศษ)' })
  getEffectivePermissions(@Param('userId', ParseIntPipe) userId: number) {
    return this.permissionsService.getEffectivePermissions(userId);
  }

  // ---------- Assignments ----------

  @Post('role/:roleId/:permissionId')
  @ApiOperation({ summary: 'มอบสิทธิ์ให้บทบาท' })
  assignToRole(
    @Param('roleId', ParseIntPipe) roleId: number,
    @Param('permissionId', ParseIntPipe) permissionId: number,
  ) {
    return this.permissionsService.assignPermissionToRole(roleId, permissionId);
  }

  @Delete('role/:roleId/:permissionId')
  @ApiOperation({ summary: 'ถอนสิทธิ์จากบทบาท' })
  removeFromRole(
    @Param('roleId', ParseIntPipe) roleId: number,
    @Param('permissionId', ParseIntPipe) permissionId: number,
  ) {
    return this.permissionsService.removePermissionFromRole(roleId, permissionId);
  }

  @Post('user/:userId/:permissionId')
  @ApiOperation({ summary: 'มอบสิทธิ์พิเศษให้ผู้ใช้' })
  @ApiQuery({ name: 'isDeny', required: false, type: Boolean, description: 'True = สั่งห้ามเข้าถึง' })
  @ApiQuery({ name: 'expiredAt', required: false, type: String })
  @ApiQuery({ name: 'remark', required: false, type: String })
  assignToUser(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('permissionId', ParseIntPipe) permissionId: number,
    @Query('isDeny') isDeny?: string,
    @Query('expiredAt') expiredAt?: string,
    @Query('remark') remark?: string,
  ) {
    const expiry = expiredAt ? new Date(expiredAt) : undefined;
    const isDenyBool = isDeny === 'true';
    return this.permissionsService.assignPermissionToUser(userId, permissionId, isDenyBool, expiry, remark);
  }

  @Delete('user/:userId/:permissionId')
  @ApiOperation({ summary: 'ถอนสิทธิ์พิเศษจากผู้ใช้' })
  removeFromUser(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('permissionId', ParseIntPipe) permissionId: number,
  ) {
    return this.permissionsService.removePermissionFromUser(userId, permissionId);
  }
}
