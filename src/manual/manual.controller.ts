import { Controller, Get, Put, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ManualService } from './manual.service';
import { UpdateManualDto } from './dto/update-manual.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('User Manual Settings (ตั้งค่าดาวน์โหลดคู่มือ)')
@Controller('manual')
export class ManualController {
  constructor(private readonly manualService: ManualService) {}

  @Get()
  @ApiOperation({ summary: 'ดึงข้อมูลตั้งค่าคู่มือการใช้งาน' })
  getManual() {
    return this.manualService.getManual();
  }

  @Put()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'บันทึกข้อมูลตั้งค่าคู่มือการใช้งาน' })
  updateManual(@Body() updateDto: UpdateManualDto, @Req() req: any) {
    const userId = req.user?.userId ? req.user.userId.toString() : 'anonymous';
    return this.manualService.updateManual(updateDto, userId);
  }

  @Get('logs')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'ดูประวัติการแก้ไขตั้งค่าคู่มือ' })
  getLogs() {
    return this.manualService.getLogs();
  }
}
