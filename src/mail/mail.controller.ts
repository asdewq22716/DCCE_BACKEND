import { Controller, Post, Body, InternalServerErrorException, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { MailService } from '../common/services/mail.service';
import { MailFormat } from '../common/utils/mail-format.util';
import { ContactAdminDto } from './dto/contact-admin.dto';
import { ContactPublicDto } from './dto/contact-public.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UsersService } from '../users/users.service';

@ApiTags('Mail (ติดต่อสอบถามแอดมิน)')
@Controller('mail')
export class MailController {
  constructor(
    private readonly mailService: MailService,
    private readonly configService: ConfigService,
    private readonly usersService: UsersService
  ) { }

  @Post('contact')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'ส่งข้อความติดต่อสอบถามแอดมิน (ดึงข้อมูลผู้ส่งอัตโนมัติจาก SSO)' })
  async contactAdmin(@Req() req: any, @Body() dto: ContactAdminDto) {
    // 1. ดึงข้อมูล User จากฐานข้อมูลผ่าน userId ใน Token
    const userId = req.user.userId;
    const userData = await this.usersService.getUserById(userId);
    const ssoUser = userData.user;

    const senderName = ssoUser.full_name || 'ไม่ระบุชื่อ (ผู้ใช้งาน SSO)';
    const senderEmail = ssoUser.sso_email || '-';

    // 2. ดึงอีเมลปลายทางของ Admin จาก .env
    const adminEmail = this.configService.get<string>('ADMIN_EMAIL_NOTIFY');
    if (!adminEmail) {
      throw new InternalServerErrorException('ระบบไม่ได้ตั้งค่าอีเมลผู้ดูแลระบบ (ADMIN_EMAIL_NOTIFY)');
    }

    // 3. ปั้น HTML Format จาก DTO และข้อมูล User
    const title = dto.title || 'สอบถามข้อมูล / ขอใช้งานระบบเพิ่มเติม';
    const htmlContent = MailFormat.buildContactAdminHtml(title, dto.message, senderName, senderEmail);
    const subject = `[Contact] สอบถามแอดมิน: ${title}`;

    // 4. เรียกใช้งาน MailService เพื่อส่งเมล
    const isSuccess = await this.mailService.sendMail(adminEmail, subject, htmlContent);

    if (!isSuccess) {
      throw new InternalServerErrorException('ไม่สามารถส่งข้อความได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง หรือตรวจสอบการตั้งค่า SMTP');
    }

    return {
      success: true,
      message: 'ส่งข้อความติดต่อสอบถามเรียบร้อยแล้ว แอดมินจะติดต่อกลับตามอีเมล SSO ในภายหลัง',
    };
  }

  @Post('public-contact')
  @ApiOperation({ summary: 'ส่งข้อความติดต่อสอบถามแอดมิน (สำหรับบุคคลภายนอก ไม่ต้อง Login)' })
  async contactPublic(@Body() dto: ContactPublicDto) {
    // 1. ดึงอีเมลปลายทางของ Admin จาก .env
    const adminEmail = this.configService.get<string>('ADMIN_EMAIL_NOTIFY');
    if (!adminEmail) {
      throw new InternalServerErrorException('ระบบไม่ได้ตั้งค่าอีเมลผู้ดูแลระบบ (ADMIN_EMAIL_NOTIFY)');
    }

    // 2. ปั้น HTML Format จาก DTO
    const title = dto.title || 'สอบถามข้อมูลจากบุคคลภายนอก';
    const htmlContent = MailFormat.buildContactPublicHtml(title, dto.message, dto.senderName, dto.email, dto.phone);
    const subject = `[Contact] สอบถามแอดมิน (บุคคลภายนอก): ${title}`;

    // 3. เรียกใช้งาน MailService เพื่อส่งเมล
    const isSuccess = await this.mailService.sendMail(adminEmail, subject, htmlContent);

    if (!isSuccess) {
      throw new InternalServerErrorException('ไม่สามารถส่งข้อความได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง หรือตรวจสอบการตั้งค่า SMTP');
    }

    return {
      success: true,
      message: 'ส่งข้อความติดต่อสอบถามเรียบร้อยแล้ว แอดมินจะติดต่อกลับในภายหลัง',
    };
  }
}
