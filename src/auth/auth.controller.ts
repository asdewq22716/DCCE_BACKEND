import {
  Body,
  Controller,
  Post,
  Res,
  Get,
  UseGuards,
  Req,
} from '@nestjs/common';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SsoLoginDto } from './dto/sso-login.dto';
import { SsoVerifyDto } from './dto/sso-verify.dto';
import {
  SsoAuthResponseDto,
  TypeRoles,
} from './interfaces/sso-response.interface';
import { UsersService } from 'src/users/users.service';
import { PermissionsService } from 'src/permissions/permissions.service';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
    private readonly permissionsService: PermissionsService,
  ) {}
  @Post('sso/login')
  @ApiOperation({ summary: 'SSO Login using credentials' })
  async login(
    @Body() dto: SsoLoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ user: SsoAuthResponseDto; roles: TypeRoles[] }> {
    const user_data = await this.authService.login(dto.user, dto.pass);
    const { user, roles } = await this.usersService.getUserById(
      user_data.user_id,
    );
    const token = this.authService.getCookieWithJwtToken({
      userId: user.user_id,
      username: user.sso_username,
    });
    res.cookie('access_token', token, { httpOnly: true });
    return {
      user: user,
      roles: roles,
    };
  }

  @Post('sso/verify')
  @ApiOperation({ summary: 'Verify SSO Token' })
  async verify(
    @Body() dto: SsoVerifyDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ user: SsoAuthResponseDto; roles: TypeRoles[] }> {
    const user_data = await this.authService.verify(dto.token);
    const { user, roles } = await this.usersService.getUserById(
      user_data.user_id,
    );
    const token = this.authService.getCookieWithJwtToken({
      userId: user.user_id,
      username: user.sso_username,
    });
    res.cookie('access_token', token, { httpOnly: true });
    return {
      user: user,
      roles: roles,
    };
  }

  @Post('sso/logout')
  @ApiOperation({ summary: 'Logout and clear cookie' })
  async logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('access_token');
    return { message: 'Logged out successfully' };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiOperation({ summary: 'Get current user profile and effective permissions' })
  async getProfile(@Req() req: any) {
    const userId = req.user.userId;
    const { user } = await this.usersService.getUserById(userId);
    const permissions = await this.permissionsService.getEffectivePermissions(userId);

    return {
      user: user,
      permissions: permissions
    };
  }
}
