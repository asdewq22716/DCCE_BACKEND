import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { SsoAuthData, SsoBaseResponse, SsoAuthResponseDto } from './interfaces/sso-response.interface';
import { BaseApiService } from 'src/common/services/base-api.service';
import { FncDB } from 'src/common/services/fnc-db.service';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService extends BaseApiService {
  private readonly ssoBaseUrl: string;

  constructor(
    httpService: HttpService,
    protected readonly configService: ConfigService,
    private readonly db: FncDB,
    private readonly jwtService: JwtService,
  ) {
    super(httpService);
    // ดึงค่า URL จาก .env
    this.ssoBaseUrl = this.configService.get<string>('SSO_BASE_URL')!;
  }

  /**
   * แอบฝัง Header / Token ไปกับทุกๆ การยิง API ภายใน AuthService
   */
  protected override getDefaultConfig() {
    //const appName = this.configService.get<string>('SSO_APP_NAME');
    return {
      headers: {}
    };
  }

  public getCookieWithJwtToken(userId: string | number, username: string) {
    const payload = { sub: userId, username };
    const token = this.jwtService.sign(payload);
    return token;
  }

  /**
   * 1. ฟังก์ชันล็อกอิน SSO
   */
  async login(username: string, password: string): Promise<SsoAuthResponseDto> {
    try {
      const { result_code, result_text, result_data } =
        await this.get<SsoBaseResponse<SsoAuthData>>({
          url: `${this.ssoBaseUrl}/auth2/`,
          config: { params: { user: username, pass: password } }
        });

      if (result_code !== '1000') {
        const errorMsg = result_text || 'Username หรือ Password ไม่ถูกต้อง';
        this.logger.warn(`SSO Login Reject: ${errorMsg}`);
        throw new UnauthorizedException(errorMsg);
      }

      // Sync ข้อมูลลงตาราง users ใหม่
      await this.syncUser(result_data);

      // ตรวจสอบสิทธิ์การเข้าใช้งานจากตาราง users (is_active = 1) ด้วย FncDB 🚀
      const users = await this.db.select<any>('users', {
        sso_userid: result_data.userid,
        is_active: 1
      });

      if (users.length === 0) {
        throw new UnauthorizedException('บัญชีผู้ใช้งานนี้ไม่ได้รับอนุญาตให้เข้าใช้งาน');
      }

      const u = users[0];
      return this.mapUserToResponse(u);

    } catch (err: any) {
      if (err instanceof UnauthorizedException) throw err;
      this.logger.error(`Login Process Error: ${err.message}`);
      throw new BadRequestException('ไม่สามารถเข้าสู่ระบบผ่าน SSO ได้ในขณะนี้');
    }
  }

  /**
   * 2. ฟังก์ชันตรวจสอบ Token
   */
  async verify(token: string): Promise<SsoAuthResponseDto> {


    try {
      const { result_code, result_data } =
        await this.get<SsoBaseResponse<SsoAuthData>>(
          {
            url: `${this.ssoBaseUrl}/verify2`,
            config: { params: { token } }
          });

      if (result_code !== '1000') {
        throw new UnauthorizedException('Token ไม่ถูกต้องหรือหมดอายุแล้ว');
      }

      const users = await this.db.select<any>('users', { sso_userid: result_data.userid, is_active: 1 });

      if (users.length === 0) {
        throw new UnauthorizedException('บัญชีผู้ใช้งานนี้ไม่ได้รับอนุญาตให้เข้าใช้งาน');
      }

      const u = users[0];
      return this.mapUserToResponse(u);

    } catch (err: any) {
      if (err instanceof UnauthorizedException) throw err;
      this.logger.error(`Verify Token Error: ${err.message}`);
      throw new BadRequestException('ไม่สามารถตรวจสอบสถานะ Token ได้');
    }
  }



  /**
   * 3. ฟังก์ชัน Sync ข้อมูลจาก SSO ลงตาราง users
   */
  private async syncUser(data: SsoAuthData) {
    const table = 'users';

    // 1. ตรวจสอบว่ามี User นี้อยู่หรือยัง
    const users = await this.db.select(table, { sso_userid: data.userid });

    if (users.length > 0) {
      // 1. กรณี Update: ข้อมูลที่ต้องปรับปรุงทุกครั้งที่ Login (ไม่แตะต้อง is_active)
      const updateData = {
        sso_username: data.username,
        sso_token: data.token,
        sso_idcard_no: data.idcard_no,
        sso_email: data.email,
        sso_prefix_name: data.prefix_name,
        sso_firstname: data.firstname,
        sso_lastname: data.lastname,
        sso_work_position_text: data.work_position_text,
        sso_work_place_text: data.work_place_text,
        sso_work_place_id: data.work_place_id,
        sso_work_place_name: data.work_place_name,
        sso_work_place_type_id: data.work_place_type_id,
        sso_work_place_type_name: data.work_place_type_name,
        sso_division_id: data.division_id,
        sso_division_name: data.division_name,
        sso_sub_division_id: data.sub_division_id,
        sso_sub_division_name: data.sub_division_name,
        full_name: `${data.prefix_name || ''}${data.firstname} ${data.lastname}`.trim(),
        last_login: new Date()
      };

      this.logger.log(`Update user profile: ${data.username}`);
      await this.db.update(table, updateData, { sso_userid: data.userid });

    } else {
      // 2. กรณี Insert: ข้อมูลเริ่มต้นสำหรับผู้ใช้งานใหม่
      const insertData = {
        sso_userid: data.userid,
        sso_username: data.username,
        sso_token: data.token,
        sso_idcard_no: data.idcard_no,
        sso_email: data.email,
        sso_prefix_name: data.prefix_name,
        sso_firstname: data.firstname,
        sso_lastname: data.lastname,
        sso_work_position_text: data.work_position_text,
        sso_work_place_text: data.work_place_text,
        sso_work_place_id: data.work_place_id,
        sso_work_place_name: data.work_place_name,
        sso_work_place_type_id: data.work_place_type_id,
        sso_work_place_type_name: data.work_place_type_name,
        sso_division_id: data.division_id,
        sso_division_name: data.division_name,
        sso_sub_division_id: data.sub_division_id,
        sso_sub_division_name: data.sub_division_name,
        full_name: `${data.prefix_name || ''}${data.firstname} ${data.lastname}`.trim(),
        last_login: new Date(),
        is_active: 1 // ตั้งค่าเริ่มต้นเป็น 1 เฉพาะตอนสร้างใหม่
      };

      this.logger.log(`Insert new user: ${data.username}`);
      await this.db.insert(table, insertData);
    }
  }

  /**
   * Helper สำหรับแปลงข้อมูลจากตาราง users กลับเป็น DTO สำหรับ Response
   */
  private mapUserToResponse(u: any): SsoAuthResponseDto {
    return {
      userid: u.sso_userid,
      username: u.sso_username,
      token: u.sso_token,
      idcard_no: u.sso_idcard_no,
      email: u.sso_email,
      prefix_name: u.sso_prefix_name,
      firstname: u.sso_firstname,
      lastname: u.sso_lastname,
      work_position_text: u.sso_work_position_text,
      work_place_text: u.sso_work_place_text,
      work_place_id: u.sso_work_place_id,
      work_place_name: u.sso_work_place_name,
      work_place_type_id: u.sso_work_place_type_id,
      work_place_type_name: u.sso_work_place_type_name,
      division_id: u.sso_division_id,
      division_name: u.sso_division_name,
      sub_division_id: u.sso_sub_division_id,
      sub_division_name: u.sso_sub_division_name,
      last_login: u.last_login,
      remark: u.remark,
      is_active: u.is_active
    };
  }
}
