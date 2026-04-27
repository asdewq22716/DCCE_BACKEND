import { Body, Controller, Post } from '@nestjs/common';
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
  async login(@Body() dto: SsoLoginDto): Promise<SsoAuthResponseDto> {
    return this.authService.login(dto.user, dto.pass);
  }

  @Post('sso/verify')
  @ApiOperation({ summary: 'Verify SSO Token' })
  async verify(@Body() dto: SsoVerifyDto): Promise<SsoAuthResponseDto> {
    return this.authService.verify(dto.token);
  }
}
