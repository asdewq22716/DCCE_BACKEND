import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TitleBannerSettingsService } from './title-banner-settings.service';
import { CreateTitleBannerSettingDto } from './dto/create-title-banner-setting.dto';
import { UpdateTitleBannerSettingDto } from './dto/update-title-banner-setting.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Title Banner Settings')
@Controller('title-banner-settings')
export class TitleBannerSettingsController {
  constructor(private readonly titleBannerSettingsService: TitleBannerSettingsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'สร้างข้อมูลตั้งค่าคำอธิบายแบนเนอร์' })
  create(@Body() createDto: CreateTitleBannerSettingDto, @Req() req: any) {
    const userId = req.user?.userId ? req.user.userId.toString() : 'anonymous';
    return this.titleBannerSettingsService.create(createDto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'ดึงรายการตั้งค่าคำอธิบายแบนเนอร์ทั้งหมด' })
  findAll() {
    return this.titleBannerSettingsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'ดึงรายละเอียดการตั้งค่าตาม ID' })
  findOne(@Param('id') id: string) {
    return this.titleBannerSettingsService.findOne(+id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'แก้ไขข้อมูลการตั้งค่าคำอธิบายแบนเนอร์' })
  update(@Param('id') id: string, @Body() updateDto: UpdateTitleBannerSettingDto, @Req() req: any) {
    const userId = req.user?.userId ? req.user.userId.toString() : 'anonymous';
    return this.titleBannerSettingsService.update(+id, updateDto, userId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'ลบข้อมูลการตั้งค่า' })
  remove(@Param('id') id: string, @Req() req: any) {
    const userId = req.user?.userId ? req.user.userId.toString() : 'anonymous';
    return this.titleBannerSettingsService.remove(+id, userId);
  }

  @Get(':id/logs')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'ดูประวัติการแก้ไข (Audit Logs)' })
  getLogs(@Param('id') id: string) {
    return this.titleBannerSettingsService.getLogs(+id);
  }
}
