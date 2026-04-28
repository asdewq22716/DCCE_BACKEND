import { Body, Controller, Post, Res, Get, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SsoLoginDto } from './dto/sso-login.dto';
import { SsoVerifyDto } from './dto/sso-verify.dto';
import { SsoAuthResponseDto } from './interfaces/sso-response.interface';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }
  @Post('sso/login')
  @ApiOperation({ summary: 'SSO Login using credentials' })
  async login(
    @Body() dto: SsoLoginDto,
    @Res({ passthrough: true }) res: Response
  ): Promise<SsoAuthResponseDto> {
    const user = await this.authService.login(dto.user, dto.pass);
    const token = this.authService.getCookieWithJwtToken(user.userid, user.username);
    res.cookie('access_token', token, { httpOnly: true });
    return user;
  }

  @Post('sso/verify')
  @ApiOperation({ summary: 'Verify SSO Token' })
  async verify(
    @Body() dto: SsoVerifyDto,
    @Res({ passthrough: true }) res: Response
  ): Promise<SsoAuthResponseDto> {
    const user = await this.authService.verify(dto.token);
    const token = this.authService.getCookieWithJwtToken(user.userid, user.username);
    res.cookie('access_token', token, { httpOnly: true });
    return user;
  }

  @Post('sso/logout')
  @ApiOperation({ summary: 'Logout and clear cookie' })
  async logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('access_token');
    return { message: 'Logged out successfully' };
  }

  // --- ตัวอย่างการนำ Guard ไปใช้งาน ---
  @UseGuards(JwtAuthGuard) // 👈 แปะป้ายบอกว่าต้องมี Cookie มาก่อนถึงจะเข้าเส้นนี้ได้
  @Get('me')
  @ApiOperation({ summary: 'Get current user profile (Protected API)' })
  getProfile(@Req() req: any) {
    // ถ้ายาม (Guard) ตรวจผ่าน จะเอาข้อมูลใน Token มาใส่ไว้ใน req.user ให้เราใช้งานต่อ
    console.log("=== ข้อมูลใน req.user ===");
    console.log(req.user);
    return {
      message: 'ยินดีด้วย คุณผ่านด่านเข้ามาได้!',
      user_info_from_token: req.user, // เช่น { userId: '123', username: 'john' }
    };
  }
}
