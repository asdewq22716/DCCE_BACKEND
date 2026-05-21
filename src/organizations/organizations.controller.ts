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
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { OrganizationsService } from './organizations.service';
import { AssignUserDto } from './dto/assign-user.dto';
import { CreateBranchWithUnitsDto } from './dto/create-branch-with-units.dto';
import { UpdateBranchWithUnitsDto } from './dto/update-branch-with-units.dto';
import { BranchQueryDto } from './dto/organizations-queries.dto';
import { OrganizationType } from './types/organization.type';

@ApiTags('Organizations')
@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) { }

  @Post('branches-with-units')
  @ApiOperation({ summary: 'สร้างสาขาหลักพร้อมจัดตั้งหน่วยงานย่อยรวดเดียว (Bulk Insert ด้วย Transaction)' })
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

  @Put('branches-with-units')
  @ApiOperation({ summary: 'แก้ไขสาขาหลักพร้อมปรับแต่งหน่วยงานย่อยทั้งหมดรวดเดียว (Bulk Upsert & Delete ด้วย Transaction)' })
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

  @Get('branches')
  @ApiOperation({ summary: 'ดึงรายชื่อสาขาหลักทั้งหมดพร้อมแผนกย่อย (หรือเจาะจงเฉพาะสาขาหลักรายตัวผ่าน Query ?id=18)' })
  findAllBranches(@Query() query: BranchQueryDto): Promise<OrganizationType | OrganizationType[]> {
    const branchId = query.id ? parseInt(query.id, 10) : undefined;
    return this.organizationsService.findAllBranches(branchId);
  }

  @Delete('branches/:id')
  @ApiOperation({ summary: 'ลบสาขาหลักพร้อมแผนกย่อยทั้งหมดภายใต้สาขานั้น (Soft Delete)' })
  deleteBranch(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const context = {
      userId: req.user?.userId || null,
      ipAddress: req.ip || req.connection?.remoteAddress || null,
      userAgent: req.headers['user-agent'] || null,
    };
    return this.organizationsService.deleteBranch(id, context);
  }

  // ---------- User Assignment Endpoints ----------

  @Post('assign')
  @ApiOperation({ summary: 'นำผู้ใช้งานเข้าผูกสังกัดกับหน่วยงาน/กรมย่อย' })
  assignUserToOrg(@Body() dto: AssignUserDto) {
    return this.organizationsService.assignUserToOrg(dto);
  }

  @Delete('assign')
  @ApiOperation({ summary: 'ถอดถอนผู้ใช้งานออกจากสังกัดหน่วยงาน/กรมย่อย' })
  removeUserFromOrg(@Body() dto: AssignUserDto) {
    return this.organizationsService.removeUserFromOrg(dto);
  }
}
