import { Controller, Get, Post, Body, Param, Put, Patch, Delete, UseGuards, Req, Query, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ApiRequestsService } from './api-requests.service';
import { CreateApiRequestDto } from './dto/create-api-request.dto';
import { UpdateApiRequestDto, UpdateApiRequestStatusDto } from './dto/update-api-request.dto';
import { ApiRequestQueryDto } from './dto/api-request-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('API Requests (แบบฟอร์มคำขอใช้งาน API)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api-requests')
export class ApiRequestsController {
  constructor(private readonly apiRequestsService: ApiRequestsService) { }

  @Get()
  @ApiOperation({ summary: 'ดึงรายการคำขอใช้งาน API ทั้งหมด (พร้อมฟิลเตอร์และการแบ่งหน้า)' })
  findAll(@Query() query: ApiRequestQueryDto) {
    return this.apiRequestsService.findAll(query);
  }

  @Get('backoffice')
  @ApiOperation({ summary: 'ดึงรายการคำขอใช้งาน API (สำหรับหลังบ้าน - เฉพาะ Admin และ SuperUser)' })
  findAllBackoffice(@Query() query: ApiRequestQueryDto, @Req() req: any) {
    const userId = req.user?.userId || 'anonymous';
    return this.apiRequestsService.findAllBackoffice(query, userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'ดึงรายละเอียดคำขอใช้งาน API ตาม ID' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.apiRequestsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'เพิ่มคำขอใช้งาน API ใหม่ (Request ID สร้างให้อัตโนมัติ)' })
  create(@Body() createDto: CreateApiRequestDto, @Req() req: any) {
    const userId = req.user?.userId || 'anonymous';
    return this.apiRequestsService.create(createDto, userId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'แก้ไขข้อมูลคำขอใช้งาน API' })
  update(@Param('id', ParseIntPipe) id: number, @Body() updateDto: UpdateApiRequestDto, @Req() req: any) {
    const userId = req.user?.userId || 'anonymous';
    return this.apiRequestsService.update(id, updateDto, userId);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'อัปเดตสถานะการอนุมัติ (pending, approved, rejected)' })
  updateStatus(@Param('id', ParseIntPipe) id: number, @Body() updateDto: UpdateApiRequestStatusDto, @Req() req: any) {
    const userId = req.user?.userId || 'anonymous';
    return this.apiRequestsService.updateStatus(id, updateDto, userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'ลบคำขอใช้งาน API' })
  remove(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    const userId = req.user?.userId || 'anonymous';
    return this.apiRequestsService.remove(id, userId);
  }
}
