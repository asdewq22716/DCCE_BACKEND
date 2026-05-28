import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BannersService } from './banners.service';
import { CreateBannerDto } from './dto/create-banner.dto';
import { UpdateBannerDto } from './dto/update-banner.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Banners')
@Controller('banners')
export class BannersController {
  constructor(private readonly bannersService: BannersService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'สร้างแบนเนอร์ใหม่' })
  create(@Body() createBannerDto: CreateBannerDto, @Req() req: any) {
    const userId = req.user?.userId ? req.user.userId.toString() : 'anonymous';
    return this.bannersService.create(createBannerDto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'ดึงรายการแบนเนอร์ทั้งหมด' })
  findAll() {
    return this.bannersService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'ดึงรายละเอียดแบนเนอร์ตาม ID' })
  findOne(@Param('id') id: string) {
    return this.bannersService.findOne(+id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'แก้ไขข้อมูลแบนเนอร์' })
  update(@Param('id') id: string, @Body() updateBannerDto: UpdateBannerDto, @Req() req: any) {
    const userId = req.user?.userId ? req.user.userId.toString() : 'anonymous';
    return this.bannersService.update(+id, updateBannerDto, userId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'ลบแบนเนอร์ (Soft Delete)' })
  remove(@Param('id') id: string, @Req() req: any) {
    const userId = req.user?.userId ? req.user.userId.toString() : 'anonymous';
    return this.bannersService.remove(+id, userId);
  }

  @Get(':id/logs')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'ดูประวัติการแก้ไขแบนเนอร์ (Audit Logs)' })
  getLogs(@Param('id') id: string) {
    return this.bannersService.getLogs(+id);
  }
}
