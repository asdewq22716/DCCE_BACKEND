import { Controller, Get, Post, Put, Patch, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { FaqSettingService } from './faq-setting.service';
import { CreateFaqSettingDto } from './dto/create-faq-setting.dto';
import { UpdateFaqSettingDto } from './dto/update-faq-setting.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('FAQ Settings (ตั้งค่าคำถามที่พบบ่อย)')
@Controller('faq-setting')
export class FaqSettingController {
  constructor(private readonly faqSettingService: FaqSettingService) {}

  @Get()
  @ApiOperation({ summary: 'ดึงรายการคำถามที่พบบ่อยทั้งหมด' })
  findAll() {
    return this.faqSettingService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'ดึงรายละเอียดคำถามที่พบบ่อยตาม ID' })
  findOne(@Param('id') id: string) {
    return this.faqSettingService.findOne(+id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'เพิ่มหัวข้อคำถามใหม่' })
  create(@Body() createDto: CreateFaqSettingDto, @Req() req: any) {
    const userId = req.user?.userId ? req.user.userId.toString() : 'anonymous';
    return this.faqSettingService.create(createDto, userId);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'อัปเดตข้อมูลและสถานะคำถาม' })
  update(@Param('id') id: string, @Body() updateDto: UpdateFaqSettingDto, @Req() req: any) {
    const userId = req.user?.userId ? req.user.userId.toString() : 'anonymous';
    return this.faqSettingService.update(+id, updateDto, userId);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'เปิด/ปิดสถานะการใช้งาน (สวิตช์ Toggle)' })
  updateStatus(@Param('id') id: string, @Body() body: UpdateStatusDto, @Req() req: any) {
    const userId = req.user?.userId ? req.user.userId.toString() : 'anonymous';
    return this.faqSettingService.updateStatus(+id, body.is_active, userId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'ลบหัวข้อคำถาม (Soft Delete)' })
  remove(@Param('id') id: string, @Req() req: any) {
    const userId = req.user?.userId ? req.user.userId.toString() : 'anonymous';
    return this.faqSettingService.remove(+id, userId);
  }

  @Get(':id/logs')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'ดูประวัติการแก้ไข' })
  getLogs(@Param('id') id: string) {
    return this.faqSettingService.getLogs(+id);
  }
}
