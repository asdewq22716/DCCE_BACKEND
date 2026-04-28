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
          let data = request?.cookies['access_token'];
          if (!data) {
            return null;
          }
          return data;
        },
      ]),
      ignoreExpiration: false,
      // 2. ใช้ Secret Key ตัวเดียวกับตอน Sign Token
      secretOrKey: configService.get<string>('JWT_SECRET') || 'fallback_secret_key_for_dev',
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
      username: payload.username
    };
  }
}
