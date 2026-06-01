import { Controller, Get, Put, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AboutUsService } from './about-us.service';
import { UpdateAboutUsDto } from './dto/update-about-us.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('About Us (ตั้งค่าข้อมูลเกี่ยวกับเรา)')
@Controller('about-us')
export class AboutUsController {
  constructor(private readonly aboutUsService: AboutUsService) { }

  @Get()
  @ApiOperation({ summary: 'ดึงข้อมูลตั้งค่าเกี่ยวกับเรา' })
  getAboutUs() {
    return this.aboutUsService.getAboutUs();
  }

  @Put()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'บันทึก/อัปเดต ข้อมูลตั้งค่าเกี่ยวกับเรา' })
  updateAboutUs(@Body() updateDto: UpdateAboutUsDto, @Req() req: any) {
    const userId = req.user?.userId ? req.user.userId.toString() : 'anonymous';
    return this.aboutUsService.updateAboutUs(updateDto, userId);
  }

  @Get('logs')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'ดูประวัติการแก้ไขข้อมูลเกี่ยวกับเรา (Audit Logs)' })
  getLogs() {
    return this.aboutUsService.getLogs();
  }
}
