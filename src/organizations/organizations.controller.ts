import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OrganizationsService } from './organizations.service';
import { AssignUserDto } from './dto/assign-user.dto';
import { AssignQueryDto } from './dto/assign-query.dto';
import { OrgAccessDto } from './dto/org-access.dto';
import { CreateBranchWithUnitsDto } from './dto/create-branch-with-units.dto';
import { UpdateBranchWithUnitsDto } from './dto/update-branch-with-units.dto';
import { CreateUnitDto } from './dto/create-unit.dto';
import { UpdateUnitDetailDto } from './dto/update-unit-detail.dto';
import { BranchQueryDto } from './dto/organizations-queries.dto';
import { AssignOrgPermissionsDto } from './dto/assign-org-permissions.dto';
import { OrganizationType } from './types/organization.type';

@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) { }

  // ==========================================
  // 📂 Branch & Unit CRUD
  // ==========================================

  @ApiTags('Organizations - Branches')
  @Post('branches-with-units')
  @ApiOperation({
    summary:
      'สร้างสาขาหลักพร้อมจัดตั้งหน่วยงานย่อยรวดเดียว (Bulk Insert ด้วย Transaction)',
  })
  createBranchWithUnits(
    @Req() req: any,
    @Body() dto: CreateBranchWithUnitsDto,
  ): Promise<OrganizationType> {
    const context = {
      userId: req.user?.userId || null,
      ipAddress: req.ip || req.connection?.remoteAddress || null,
      userAgent: req.headers['user-agent'] || null,
    };
    return this.organizationsService.createBranchWithUnits(dto, context);
  }

  @ApiTags('Organizations - Branches')
  @Put('branches-with-units')
  @ApiOperation({
    summary:
      'แก้ไขสาขาหลักพร้อมปรับแต่งหน่วยงานย่อยทั้งหมดรวดเดียว (Bulk Upsert & Delete ด้วย Transaction)',
  })
  updateBranchWithUnits(
    @Req() req: any,
    @Body() dto: UpdateBranchWithUnitsDto,
  ) {
    const context = {
      userId: req.user?.userId || null,
      ipAddress: req.ip || req.connection?.remoteAddress || null,
      userAgent: req.headers['user-agent'] || null,
    };
    return this.organizationsService.updateBranchWithUnits(dto, context);
  }

  @ApiTags('Organizations - Branches')
  @Get('branches')
  @ApiOperation({
    summary:
      'ดึงรายชื่อสาขาหลักทั้งหมดพร้อมแผนกย่อย (หรือเจาะจงเฉพาะสาขาหลักรายตัวผ่าน Query ?id=18)',
  })
  findAllBranches(
    @Query() query: BranchQueryDto,
  ): Promise<OrganizationType | OrganizationType[]> {
    const branchId = query.id ? parseInt(query.id, 10) : undefined;
    return this.organizationsService.findAllBranches(branchId);
  }

  @ApiTags('Organizations - Branches')
  @Delete('branches/:id')
  @ApiOperation({
    summary: 'ลบสาขาหลักพร้อมแผนกย่อยทั้งหมดภายใต้สาขานั้น (Soft Delete)',
  })
  deleteBranch(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    const context = {
      userId: req.user?.userId || null,
      ipAddress: req.ip || req.connection?.remoteAddress || null,
      userAgent: req.headers['user-agent'] || null,
    };
    return this.organizationsService.deleteBranch(id, context);
  }

  // ==========================================
  // 📂 Unit CRUD
  // ==========================================

  @ApiTags('Organizations - Units')
  @Post('units')
  @ApiOperation({ summary: 'สร้างหน่วยงานย่อยเดี่ยว' })
  createUnit(
    @Req() req: any,
    @Body() dto: CreateUnitDto,
  ): Promise<OrganizationType> {
    const context = {
      userId: req.user?.userId || null,
      ipAddress: req.ip || req.connection?.remoteAddress || null,
      userAgent: req.headers['user-agent'] || null,
    };
    return this.organizationsService.createUnit(dto, context);
  }

  @ApiTags('Organizations - Units')
  @Put('units/:id')
  @ApiOperation({ summary: 'แก้ไขข้อมูลหน่วยงานย่อยเดี่ยว' })
  updateUnit(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUnitDetailDto,
  ) {
    const context = {
      userId: req.user?.userId || null,
      ipAddress: req.ip || req.connection?.remoteAddress || null,
      userAgent: req.headers['user-agent'] || null,
    };
    return this.organizationsService.updateUnit(id, dto, context);
  }

  @ApiTags('Organizations - Units')
  @Get('units')
  @ApiOperation({
    summary:
      'ดึงข้อมูลหน่วยงานย่อยทั้งหมด (ระดับ level = 2 และเป็นตัวที่เปิดใช้งาน)',
  })
  findAllUnits(): Promise<OrganizationType[]> {
    return this.organizationsService.findAllUnits();
  }

  // ==========================================
  // 📂 User Assignment (กำหนดสังกัดหลัก)
  // ==========================================

  @ApiTags('Organizations - Assign')
  @Get('assign')
  @ApiOperation({
    summary:
      'ดึงรายชื่อผู้ใช้งานทั้งหมดพร้อมสังกัดหลัก (สาขา + หน่วยงาน) รองรับค้นหา/กรอง',
  })
  getUsersAssignmentList(@Query() query: AssignQueryDto) {
    return this.organizationsService.getUsersAssignmentList(query);
  }

  @ApiTags('Organizations - Assign')
  @Post('assign')
  @ApiOperation({
    summary:
      'กำหนดสังกัดหลักให้ผู้ใช้งาน (ถ้ามีสังกัดเดิมจะย้ายอัตโนมัติ) พร้อมบันทึกประวัติ',
  })
  assignUserToOrg(@Req() req: any, @Body() dto: AssignUserDto) {
    const context = {
      userId: req.user?.userId || null,
      ipAddress: req.ip || req.connection?.remoteAddress || null,
      userAgent: req.headers['user-agent'] || null,
    };
    return this.organizationsService.assignUserToOrg(dto, context);
  }

  @ApiTags('Organizations - Assign')
  @Delete('assign')
  @ApiOperation({
    summary: 'ถอดถอนผู้ใช้งานออกจากสังกัดหลัก',
  })
  removeUserFromOrg(@Req() req: any, @Body() dto: AssignUserDto) {
    const context = {
      userId: req.user?.userId || null,
      ipAddress: req.ip || req.connection?.remoteAddress || null,
      userAgent: req.headers['user-agent'] || null,
    };
    return this.organizationsService.removeUserFromOrg(dto, context);
  }

  @ApiTags('Organizations - Assign')
  @Get('assign/history/:userId')
  @ApiOperation({
    summary:
      'ดึงประวัติการย้ายสังกัดหลักของผู้ใช้งานจาก Audit Log',
  })
  getUserAssignmentHistory(
    @Param('userId', ParseIntPipe) userId: number,
  ) {
    return this.organizationsService.getUserAssignmentHistory(userId);
  }

  // ==========================================
  // 📂 Organization Access (สิทธิ์เข้าถึงองค์กรเพิ่มเติม)
  // ==========================================

  @ApiTags('Organizations - Access')
  @Post('access')
  @ApiOperation({
    summary:
      'เพิ่มสิทธิ์เข้าถึงหน่วยงาน/สาขาอื่น (ไม่ใช่สังกัดหลัก)',
  })
  addOrgAccess(@Req() req: any, @Body() dto: OrgAccessDto) {
    const context = {
      userId: req.user?.userId || null,
      ipAddress: req.ip || req.connection?.remoteAddress || null,
      userAgent: req.headers['user-agent'] || null,
    };
    return this.organizationsService.addOrgAccess(dto, context);
  }

  @ApiTags('Organizations - Access')
  @Get('access/:userId')
  @ApiOperation({
    summary:
      'ดึงรายการหน่วยงาน/สาขาที่ผู้ใช้มีสิทธิ์เข้าถึงเพิ่มเติม (ไม่รวมสังกัดหลัก)',
  })
  getUserOrgAccess(@Param('userId', ParseIntPipe) userId: number) {
    return this.organizationsService.getUserOrgAccess(userId);
  }

  @ApiTags('Organizations - Access')
  @Delete('access')
  @ApiOperation({
    summary: 'ถอนสิทธิ์เข้าถึงหน่วยงาน/สาขาเพิ่มเติม',
  })
  removeOrgAccess(@Req() req: any, @Body() dto: OrgAccessDto) {
    const context = {
      userId: req.user?.userId || null,
      ipAddress: req.ip || req.connection?.remoteAddress || null,
      userAgent: req.headers['user-agent'] || null,
    };
    return this.organizationsService.removeOrgAccess(dto, context);
  }

  // ==========================================
  // 📂 Organization Permissions (ฟังก์ชันการใช้งานขององค์กร)
  // ==========================================

  @ApiTags('Organizations - Permissions')
  @Get(':id/permissions')
  @ApiOperation({
    summary: 'ดึงรายการฟังก์ชันการใช้งานที่องค์กร/สาขานี้ได้รับสิทธิ์',
  })
  getOrganizationPermissions(@Param('id', ParseIntPipe) id: number) {
    return this.organizationsService.getOrganizationPermissions(id);
  }

  @ApiTags('Organizations - Permissions')
  @Post(':id/permissions')
  @ApiOperation({
    summary: 'บันทึกการตั้งค่าฟังก์ชันการใช้งานให้กับองค์กร (แทนที่ของเดิมทั้งหมด)',
  })
  assignOrganizationPermissions(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AssignOrgPermissionsDto,
  ) {
    const context = {
      userId: req.user?.userId || null,
      ipAddress: req.ip || req.connection?.remoteAddress || null,
      userAgent: req.headers['user-agent'] || null,
    };
    return this.organizationsService.assignOrganizationPermissions(
      id,
      dto,
      context,
    );
  }
}
