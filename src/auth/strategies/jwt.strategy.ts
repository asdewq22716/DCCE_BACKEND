import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: any) => {
          console.log('--- JWT Strategy Debug ---');
          console.log('Cookies:', request?.cookies);
          console.log('Auth Header:', request?.headers?.authorization);

          // ถ้าเป็นเส้น /auth/me ให้อ่านจาก Bearer Header อย่างเดียว (ไม่อ่านจาก Cookie)
          if (request?.path?.endsWith('/auth/me')) {
            console.log('Skipping cookie for /auth/me route. Trying Bearer token...');
            return null;
          }

          const data = request?.cookies?.['access_token'];
          if (!data) {
            console.log('No access_token cookie found. Trying Bearer token...');
            return null;
          }
          console.log('Found access_token cookie:', data.substring(0, 20) + '...');
          return data;
        },
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      // 2. ใช้ Secret Key ตัวเดียวกับตอน Sign Token
      secretOrKey:
        configService.get<string>('JWT_SECRET') ||
        'fallback_secret_key_for_dev',
    });
  }

  // 3. ฟังก์ชันนี้จะถูกเรียกเมื่อ Token ถูกต้อง เพื่อคืนค่า Payload กลับไปให้ Request Object
  async validate(payload: any) {
    if (!payload || !payload.sub) {
      throw new UnauthorizedException();
    }
    // Return ข้อมูลที่จะไปอยู่ใน req.user
    return {
      userId: payload.sub,
      username: payload.username,
    };
  }
}
