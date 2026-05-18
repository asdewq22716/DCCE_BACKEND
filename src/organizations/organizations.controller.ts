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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { OrganizationsService } from './organizations.service';
import { UpdateOrgDto } from './dto/update-org.dto';
import { AssignUserDto } from './dto/assign-user.dto';
import { CreateBranchWithUnitsDto } from './dto/create-branch-with-units.dto';
import { UpdateBranchWithUnitsDto } from './dto/update-branch-with-units.dto';
import { BranchQueryDto } from './dto/organizations-queries.dto';

@ApiTags('Organizations')
@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) { }

  @Post('branches-with-units')
  @ApiOperation({ summary: 'สร้างสาขาหลักพร้อมจัดตั้งหน่วยงานย่อยรวดเดียว (Bulk Insert ด้วย Transaction)' })
  createBranchWithUnits(@Body() dto: CreateBranchWithUnitsDto) {
    return this.organizationsService.createBranchWithUnits(dto);
  }

  @Put('branches-with-units')
  @ApiOperation({ summary: 'แก้ไขสาขาหลักพร้อมปรับแต่งหน่วยงานย่อยทั้งหมดรวดเดียว (Bulk Upsert & Delete ด้วย Transaction)' })
  updateBranchWithUnits(@Body() dto: UpdateBranchWithUnitsDto) {
    return this.organizationsService.updateBranchWithUnits(dto);
  }

  @Get('branches')
  @ApiOperation({ summary: 'ดึงรายชื่อสาขาหลักทั้งหมดพร้อมแผนกย่อย (หรือเจาะจงเฉพาะสาขาหลักรายตัวผ่าน Query ?id=18)' })
  findAllBranches(@Query() query: BranchQueryDto) {
    const branchId = query.id ? parseInt(query.id, 10) : undefined;
    return this.organizationsService.findAllBranches(branchId);
  }


  @Get(':id')
  @ApiOperation({ summary: 'ดึงข้อมูลหน่วยงาน/สาขาตาม ID' })
  findOneOrg(@Param('id', ParseIntPipe) id: number) {
    return this.organizationsService.findOneOrg(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'แก้ไขข้อมูลสาขา หรือ หน่วยงานย่อย' })
  updateOrg(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateOrgDto) {
    return this.organizationsService.updateOrg(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'ลบสาขา หรือ หน่วยงานย่อยอย่างปลอดภัย' })
  deleteOrg(@Param('id', ParseIntPipe) id: number) {
    return this.organizationsService.deleteOrg(id);
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
