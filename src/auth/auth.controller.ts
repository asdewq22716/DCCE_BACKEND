import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SsoLoginDto } from './dto/sso-login.dto';
import { SsoVerifyDto } from './dto/sso-verify.dto';
import { SsoAuthData } from './interfaces/sso-response.interface';

// @ApiTags: จัดกลุ่มในหน้า Swagger (เอกสาร API) ให้อยู่ในกลุ่ม Authentication
@ApiTags('Authentication')
// @Controller: กำหนดเส้นทางหลัก (Path) ของ Controller นี้ คือ /auth
@Controller('auth')
export class AuthController {

  // constructor: ใช้สำหรับฉีด (Inject) AuthService เข้ามา เพื่อเรียกใช้งาน Logic ต่างๆ
  constructor(private readonly authService: AuthService) { }

  /**
   * ฟังก์ชันสำหรับการ Login ผ่านระบบ SSO
   * เส้นทาง: POST /auth/sso/login
   */
  @Post('sso/login')
  @ApiOperation({ summary: 'SSO Login using credentials' }) // อธิบายชื่อฟังก์ชันใน Swagger
  async login(@Body() dto: SsoLoginDto): Promise<SsoAuthData> {
    // @Body(): ไปดึงข้อมูลที่ส่งมาใน Request Body (user, pass) มาเก็บไว้ใน dto
    // แล้วส่งต่อไปให้ authService.login ทำงาน
    return this.authService.login(dto.user, dto.pass);
  }

  /**
   * ฟังก์ชันสำหรับการตรวจสอบสถานะ Token (Verify)
   * เส้นทาง: POST /auth/sso/verify
   */
  @Post('sso/verify')
  @ApiOperation({ summary: 'Verify SSO Token' }) // อธิบายชื่อฟังก์ชันใน Swagger
  async verify(@Body() dto: SsoVerifyDto): Promise<SsoAuthData> {
    // @Body(): ไปดึง token มาจาก Request Body
    // แล้วส่งต่อไปให้ authService.verify ตรวจสอบ
    return this.authService.verify(dto.token);
  }
}
