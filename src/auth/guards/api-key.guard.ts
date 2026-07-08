import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { FncDB } from '../../common/services/fnc-db.service';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly db: FncDB) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    
    // ดึง Token จาก Header 'x-api-key' หรือ 'Authorization: Bearer <token>'
    let token = request.headers['x-api-key'];
    
    if (!token && request.headers.authorization) {
      const parts = request.headers.authorization.split(' ');
      if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') {
        token = parts[1];
      }
    }

    if (!token) {
      throw new UnauthorizedException('API Token is missing');
    }

    // ค้นหา Token ในตาราง api_tokens และ JOIN กับ api_requests เพื่อดึง branch_id
    const sql = `
      SELECT t.*, r.branch_id as req_branch_id 
      FROM api_tokens t 
      LEFT JOIN api_requests r ON t.request_id = r.request_id 
      WHERE t.token = $1 AND t.is_active = 1
    `;
    const tokens = await this.db.query(sql, [token]);

    if (tokens.length === 0) {
      throw new UnauthorizedException('Invalid or inactive API Token');
    }

    const tokenData = tokens[0];

    // ตรวจสอบวันหมดอายุ
    if (tokenData.expired_at && new Date() > new Date(tokenData.expired_at)) {
      throw new UnauthorizedException('API Token has expired');
    }

    // บันทึก Log การใช้งานและอัปเดตเวลาใช้งานล่าสุด (ทำแบบ Background ไม่ใช้ await เพื่อไม่ให้ API ช้า)
    this.logUsage(token, request.url, request.ip);

    // ยัดข้อมูล Token ใส่ Request เพื่อให้ Controller เอาไปใช้ต่อได้
    // เราจะเก็บ branch_id (ที่เป็น org_id จากฝั่งหน้าเว็บ) ไว้ใน apiToken ด้วย
    request.apiToken = {
      ...tokenData,
      branch_id: tokenData.req_branch_id
    };

    return true;
  }

  private async logUsage(token: string, endpoint: string, ip: string) {
    try {
      // อัปเดตเวลาใช้ล่าสุด
      // อัปเดตเวลาใช้ล่าสุด
      await this.db.update(
        'api_tokens',
        { last_used_at: new Date() },
        { token: token }
      );
      
      // เก็บลงตาราง Log
      await this.db.insert(
        'api_usage_logs',
        {
          token: token,
          endpoint: endpoint,
          ip_address: ip,
          status_code: 200
        }
      );
    } catch (e) {
      // ถ้า Error ตอนเก็บ Log ให้ข้ามไป ไม่ต้องทำ API พัง
      console.error('Failed to log API usage:', e);
    }
  }
}
