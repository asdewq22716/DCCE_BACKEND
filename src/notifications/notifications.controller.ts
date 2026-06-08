import { Controller, Get, Patch, Param, UseGuards, Req, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Notifications (ระบบแจ้งเตือน)')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'ดึงรายการแจ้งเตือนทั้งหมดของฉัน (My Notifications)' })
  async getMyNotifications(@Req() req: any) {
    const userId = req.user?.userId?.toString() || 'unknown';
    // หมายเหตุ: ในระบบจริง ควรดึง Role ของ user ปัจจุบันมาจาก Database หรือ JWT Payload
    // ตรงนี้สมมติให้ดึงมาจากการประยุกต์ใช้งานจริง (เช่น req.user.role ถ้ามีการฝังใน JWT)
    // หรือถ้าตอนนี้ยังไม่มีใน JWT อาจจะดึงแค่จาก userId ไปก่อน หรือ hardcode ชั่วคราว
    const roleName = req.user?.role || 'user'; // ต้องไปปรับแก้ JWT ให้แนบ role มาด้วยถ้าจะใช้เป๊ะๆ
    
    return await this.notificationsService.getMyNotifications(userId, roleName);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'ทำเครื่องหมายว่าอ่านแจ้งเตือนแล้ว' })
  async markAsRead(@Param('id', ParseIntPipe) id: number) {
    return await this.notificationsService.markAsRead(id);
  }
}
