import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { NewsSettingsService } from './news-settings.service';
import { CreateNewsSettingDto } from './dto/create-news-setting.dto';
import { UpdateNewsSettingDto } from './dto/update-news-setting.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('News Settings (ตั้งค่าข่าวประชาสัมพันธ์)')
@Controller('news-settings')
export class NewsSettingsController {
  constructor(private readonly newsSettingsService: NewsSettingsService) {}

  @Get()
  @ApiOperation({ summary: 'ดึงรายการข่าวประชาสัมพันธ์ทั้งหมด' })
  findAll() {
    return this.newsSettingsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'ดึงรายละเอียดข่าวตาม ID' })
  findOne(@Param('id') id: string) {
    return this.newsSettingsService.findOne(+id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'เพิ่มข่าวประชาสัมพันธ์ใหม่' })
  create(@Body() createDto: CreateNewsSettingDto, @Req() req: any) {
    const userId = req.user?.userId ? req.user.userId.toString() : 'anonymous';
    return this.newsSettingsService.create(createDto, userId);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'อัปเดตข้อมูลข่าวประชาสัมพันธ์' })
  update(@Param('id') id: string, @Body() updateDto: UpdateNewsSettingDto, @Req() req: any) {
    const userId = req.user?.userId ? req.user.userId.toString() : 'anonymous';
    return this.newsSettingsService.update(+id, updateDto, userId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'ลบข่าวประชาสัมพันธ์ (Soft Delete)' })
  remove(@Param('id') id: string, @Req() req: any) {
    const userId = req.user?.userId ? req.user.userId.toString() : 'anonymous';
    return this.newsSettingsService.remove(+id, userId);
  }

  @Get(':id/logs')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'ดูประวัติการแก้ไขข่าว (Audit Logs)' })
  getLogs(@Param('id') id: string) {
    return this.newsSettingsService.getLogs(+id);
  }
}
