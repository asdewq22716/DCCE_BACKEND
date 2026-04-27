import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { SsoAuthData, SsoBaseResponse } from './interfaces/sso-response.interface';
import { BaseApiService } from 'src/common/services/base-api.service';
import { FncDB } from 'src/common/services/fnc-db.service';

@Injectable()
export class AuthService extends BaseApiService {
  private readonly ssoBaseUrl: string;

  constructor(
    httpService: HttpService,
    protected readonly configService: ConfigService,
    private readonly db: FncDB
  ) {
    super(httpService);
    // ดึงค่า URL จาก .env
    this.ssoBaseUrl = this.configService.get<string>('SSO_BASE_URL')!;
  }

  /**
   * 1. ฟังก์ชันล็อกอิน SSO
   */
  async login(username: string, password: string): Promise<SsoAuthData> {
    const loginUrl = `${this.ssoBaseUrl}/auth2/`;
    const options = { params: { user: username, pass: password } };

    try {
      // เรียก API และดึงค่าที่จำเป็นออกมาใช้งานทันที (Destructuring)
      const { result_code, result_text, result_data } =
        await this.get<SsoBaseResponse<SsoAuthData>>(loginUrl, options);

      await this.syncUser(result_data);

      // ตรวจสอบ Error จากฝั่ง SSO Logic
      if (result_code !== '1000') {
        const errorMsg = result_text || 'Username หรือ Password ไม่ถูกต้อง';
        this.logger.warn(`SSO Login Reject: ${errorMsg}`);
        throw new UnauthorizedException(errorMsg);
      }

      return result_data;

    } catch (err: any) {
      if (err instanceof UnauthorizedException) throw err;

      this.logger.error(`Login Process Error: ${err.message}`);
      throw new BadRequestException('ไม่สามารถเข้าสู่ระบบผ่าน SSO ได้ในขณะนี้');
    }
  }

  /**
   * 2. ฟังก์ชันตรวจสอบ Token
   */
  async verify(token: string): Promise<SsoAuthData> {
    const verifyUrl = `${this.ssoBaseUrl}/verify2`;
    const options = { params: { token } };

    try {
      const { result_code, result_data } =
        await this.get<SsoBaseResponse<SsoAuthData>>(verifyUrl, options);

      if (result_code !== '1000') {
        throw new UnauthorizedException('Token ไม่ถูกต้องหรือหมดอายุแล้ว');
      }

      return result_data;

    } catch (err: any) {
      if (err instanceof UnauthorizedException) throw err;

      this.logger.error(`Verify Token Error: ${err.message}`);
      throw new BadRequestException('ไม่สามารถตรวจสอบสถานะ Token ได้');
    }
  }

  private async syncUser(data: SsoAuthData) {
    const table = 'user_sso';

    // 1. ตรวจสอบว่ามี User นี้อยู่หรือยัง
    const users = await this.db.select(table, { userid: data.userid });

    // เตรียมข้อมูลที่จะบันทึก (จัดกลุ่มไว้จะได้อ่านง่ายครับ)
    const userData = {
      username: data.username,
      token: data.token,
      idcard_no: data.idcard_no,
      email: data.email,
      prefix_name: data.prefix_name,
      firstname: data.firstname,
      lastname: data.lastname,
      work_position_text: data.work_position_text,
      work_place_text: data.work_place_text,
      work_place_id: data.work_place_id,
      work_place_name: data.work_place_name,
      work_place_type_id: data.work_place_type_id,
      work_place_type_name: data.work_place_type_name,
      division_id: data.division_id,
      division_name: data.division_name,
      sub_division_id: data.sub_division_id,
      sub_division_name: data.sub_division_name,
      last_login: new Date() // อัปเดตเวลาล็อกอินปัจจุบัน
    };

    if (users.length > 0) {
      // 2. ถ้ามีแล้ว -> UPDATE ข้อมูล (ค้นหาด้วย userid)
      this.logger.log(`Update user: ${data.username}`);
      await this.db.update(table, userData, { userid: data.userid });
    } else {
      // 3. ถ้ายังไม่มี -> INSERT ข้อมูลใหม่
      this.logger.log(`Insert new user: ${data.username}`);
      // สำหรับ Insert อย่าลืมใส่ userid เข้าไปด้วยนะครับ
      await this.db.insert(table, { userid: data.userid, ...userData });
    }
  }


}
