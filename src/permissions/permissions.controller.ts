import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PermissionsService } from './permissions.service';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { CreatePermissionGroupDto } from './dto/create-permission-group.dto';

@ApiTags('Permissions')
@Controller('permissions')
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Post()
  @ApiOperation({ summary: 'สร้างฟังก์ชันการใช้งานใหม่ (Feature/Action)' })
  createPermission(@Body() dto: CreatePermissionDto) {
    return this.permissionsService.createPermission(dto);
  }

  @Get()
  @ApiOperation({ summary: 'ดูรายการฟังก์ชันการใช้งานทั้งหมด' })
  getAllPermissions() {
    return this.permissionsService.getAllPermissions();
  }

  @Delete(':id')
  @ApiOperation({ summary: 'ลบฟังก์ชันการใช้งาน' })
  deletePermission(@Param('id', ParseIntPipe) id: number) {
    return this.permissionsService.deletePermission(id);
  }

  // ---------- Groups ----------

  @Post('groups')
  @ApiOperation({ summary: 'สร้างกลุ่มฟังก์ชันการใช้งานใหม่' })
  createGroup(@Body() dto: CreatePermissionGroupDto) {
    return this.permissionsService.createGroup(dto);
  }

  @Get('groups')
  @ApiOperation({ summary: 'ดูรายการกลุ่มฟังก์ชันการใช้งานทั้งหมด' })
  getAllGroups() {
    return this.permissionsService.getAllGroups();
  }

  @Delete('groups/:id')
  @ApiOperation({ summary: 'ลบกลุ่มฟังก์ชันการใช้งาน' })
  deleteGroup(@Param('id', ParseIntPipe) id: number) {
    return this.permissionsService.deleteGroup(id);
  }
}
