import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  HttpException,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import {
  SsoAuthData,
  SsoBaseResponse,
  SsoAuthResponseDto,
} from './interfaces/sso-response.interface';
import { BaseApiService } from 'src/common/services/base-api.service';
import { FncDB } from 'src/common/services/fnc-db.service';
import { FncCustom } from 'src/common/fnc-custom';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { MockSsoUtil } from 'src/common/utils/mock-sso.util';

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
      headers: {},
    };
  }

  public getCookieWithJwtToken(data: JwtPayload) {
    const payload = { sub: data.userId, username: data.username };
    const token = this.jwtService.sign(payload);
    return token;
  }

  /**
   * 1. ฟังก์ชันล็อกอิน SSO
   */
  async login(username: string, password: string): Promise<SsoAuthResponseDto> {
    try {
      const useMock = this.configService.get<string>('USE_MOCK_SSO') === 'true';
      let result_code: string;
      let result_text: string | undefined;
      let result_data: SsoAuthData;

      if (useMock) {
        this.logger.warn(`⚠️ USING MOCK SSO LOGIN FOR: ${username}`);
        result_code = '1000';
        result_text = 'Success';
        result_data = MockSsoUtil.getMockSsoData(username);
      } else {
        const response = await this.get<
          SsoBaseResponse<SsoAuthData>
        >({
          url: `${this.ssoBaseUrl}/auth2/`,
          config: { params: { user: username, pass: password } },
        });
        result_code = response.result_code;
        result_text = response.result_text;
        result_data = response.result_data;
      }

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
        is_active: 1,
      });

      if (users.length === 0) {
        throw new UnauthorizedException(
          'บัญชีผู้ใช้งานนี้ไม่ได้รับอนุญาตให้เข้าใช้งาน',
        );
      }

      const u = users[0];

      // 4. ตรวจสอบว่ามี Role ผูกอยู่หรือไม่ ถ้ายังไม่มี ให้ผูกเป็น 'USER' อัตโนมัติ (Default Role)
      const userRoles = await this.db.query('SELECT role_id FROM user_roles WHERE user_id = $1', [u.user_id]);
      if (userRoles.length === 0) {
        const defaultRole = await this.db.query("SELECT role_id FROM roles WHERE UPPER(role_name) = 'USER' AND is_active = 1");
        if (defaultRole.length > 0) {
          await this.db.insert('user_roles', { user_id: u.user_id, role_id: defaultRole[0].role_id });
          this.logger.log(`Auto-assigned default 'USER' role to user_id: ${u.user_id}`);
        } else {
          this.logger.warn(`Default 'USER' role not found in database! Please create it.`);
        }
      }

      return this.mapUserToResponse(u);
    } catch (err: any) {
      this.logger.error(`Login Process Error Detail:`, err); // พ่น error ทั้งก้อนลง log server

      // ถ้าเป็น Exception ที่เราตั้งใจพ่นออกมาอยู่แล้ว (เช่น Unauthorized หรือ Error จาก BaseApiService) ให้พ่นต่อเลย
      if (err instanceof HttpException) throw err;

      const errorMessage = err.response?.data
        ? JSON.stringify(err.response.data)
        : err.message || 'เกิดข้อผิดพลาดไม่ทราบสาเหตุ';

      throw new BadRequestException(`ระบบขัดข้อง: ${errorMessage}`);
    }
  }

  /**
   * 2. ฟังก์ชันตรวจสอบ Token
   */
  async verify(token: string): Promise<SsoAuthResponseDto> {
    try {
      const useMock = this.configService.get<string>('USE_MOCK_SSO') === 'true';
      let result_code: string;
      let result_data: SsoAuthData;

      if (useMock) {
        this.logger.warn(`⚠️ USING MOCK SSO VERIFY`);
        result_code = '1000';
        result_data = MockSsoUtil.getMockSsoData('mock_user', token);
      } else {
        const response = await this.get<
          SsoBaseResponse<SsoAuthData>
        >({
          url: `${this.ssoBaseUrl}/verify2`,
          config: { params: { token } },
        });
        result_code = response.result_code;
        result_data = response.result_data;
      }

      if (result_code !== '1000') {
        throw new UnauthorizedException('Token ไม่ถูกต้องหรือหมดอายุแล้ว');
      }

      const users = await this.db.select<any>('users', {
        sso_userid: result_data.userid,
        is_active: 1,
      });

      if (users.length === 0) {
        throw new UnauthorizedException(
          'บัญชีผู้ใช้งานนี้ไม่ได้รับอนุญาตให้เข้าใช้งาน',
        );
      }

      const u = users[0];
      return this.mapUserToResponse(u);
    } catch (err: any) {
      if (err instanceof HttpException) throw err;
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
        full_name:
          `${data.prefix_name || ''}${data.firstname} ${data.lastname}`.trim(),
        last_login: FncCustom.dateNow(),
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
        full_name:
          `${data.prefix_name || ''}${data.firstname} ${data.lastname}`.trim(),
        last_login: FncCustom.dateNow(),
        is_active: 1, // ตั้งค่าเริ่มต้นเป็น 1 เฉพาะตอนสร้างใหม่
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
      user_id: u.user_id,
      sso_userid: u.sso_userid,
      sso_username: u.sso_username,
      sso_token: u.sso_token,
      sso_idcard_no: u.sso_idcard_no,
      sso_email: u.sso_email,
      sso_prefix_name: u.sso_prefix_name,
      sso_firstname: u.sso_firstname,
      sso_lastname: u.sso_lastname,
      sso_work_position_text: u.sso_work_position_text,
      sso_work_place_text: u.sso_work_place_text,
      sso_work_place_id: u.sso_work_place_id,
      sso_work_place_name: u.sso_work_place_name,
      sso_work_place_type_id: u.sso_work_place_type_id,
      sso_work_place_type_name: u.sso_work_place_type_name,
      sso_division_id: u.sso_division_id,
      sso_division_name: u.sso_division_name,
      sso_sub_division_id: u.sso_sub_division_id,
      sso_sub_division_name: u.sso_sub_division_name,
      last_login: u.last_login,
      is_active: u.is_active,
    };
  }
}
