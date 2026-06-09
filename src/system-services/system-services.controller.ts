import { Controller, Get, Post, Body, Put, Param, Delete, UseGuards, Request, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SystemServicesService } from './system-services.service';
import { CreateSystemServiceDto } from './dto/create-system-service.dto';
import { UpdateSystemServiceDto } from './dto/update-system-service.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('System Services (ตั้งค่าสิทธิ์ Service ของระบบ)')
@Controller('system-services')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SystemServicesController {
  constructor(private readonly systemServicesService: SystemServicesService) {}

  @Post()
  @ApiOperation({ summary: 'เพิ่ม Service ของระบบ' })
  async create(@Body() createDto: CreateSystemServiceDto, @Request() req: any) {
    const userId = req.user?.userId?.toString() || '0';
    return await this.systemServicesService.create(createDto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'ดึงรายการ Service ทั้งหมด' })
  async findAll() {
    return await this.systemServicesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'ดึงรายละเอียด Service ตาม ID' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.systemServicesService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'อัปเดตข้อมูลและสถานะ Service ตาม ID' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateSystemServiceDto,
    @Request() req: any
  ) {
    const userId = req.user?.userId?.toString() || '0';
    return await this.systemServicesService.update(id, updateDto, userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'ลบ Service (Soft Delete)' })
  async remove(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    const userId = req.user?.userId?.toString() || '0';
    return await this.systemServicesService.remove(id, userId);
  }
}
