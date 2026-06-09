import { Controller, Get, Body, Put, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { MaintenanceService } from './maintenance.service';
import { UpdateMaintenanceDto } from './dto/update-maintenance.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Maintenance Settings (ตั้งค่าระบบปิดปรับปรุง)')
@Controller('maintenance')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MaintenanceController {
  constructor(private readonly maintenanceService: MaintenanceService) {}

  @Get()
  @ApiOperation({ summary: 'ดึงข้อมูลการตั้งค่าปิดปรับปรุงระบบ' })
  async getMaintenanceSettings() {
    return await this.maintenanceService.getMaintenanceSettings();
  }

  @Put()
  @ApiOperation({ summary: 'บันทึก/อัปเดตการตั้งค่าปิดปรับปรุงระบบ' })
  async updateMaintenanceSettings(
    @Body() updateDto: UpdateMaintenanceDto,
    @Request() req: any
  ) {
    const userId = req.user?.userId?.toString() || '0';
    return await this.maintenanceService.updateMaintenanceSettings(updateDto, userId);
  }
}
