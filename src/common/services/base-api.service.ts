import { HttpService } from '@nestjs/axios';
import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { AxiosError, AxiosRequestConfig } from 'axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class BaseApiService {
  protected readonly logger = new Logger(BaseApiService.name);

  constructor(protected readonly httpService: HttpService) {}

  /**
   * ฟังก์ชันส่งคำขอแบบ GET (อ่านง่าย และจัดการ Error ในตัว)
   */
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    try {
      // 1. ยิง API และรอรับข้อมูล
      const response = await firstValueFrom(this.httpService.get<T>(url, config));
      return response.data;
    } catch (error) {
      // 2. ถ้าเกิดปัญหา ส่งไปให้ตัวจัดการ Error
      this.handleApiError(error);
    }
  }

  /**
   * ตัวจัดการ Error กลาง (เช็คละเอียด: Network, Timeout, Server Error)
   */
  private handleApiError(error: any): never {
    // กรณีเป็น Error จาก Axios (การเชื่อมต่อภายนอก)
    if (error.isAxiosError) {
      const axiosError = error as AxiosError;
      const response = axiosError.response;

      if (response) {
        // เคสที่ Server ปลายทางตอบกลับมาแต่ Error (เช่น 400, 401, 500)
        this.logger.error(`API Respond Error: ${response.status} - ${JSON.stringify(response.data)}`);
        throw new HttpException(
          { message: 'เซิร์ฟเวอร์ปลายทางแจ้งข้อผิดพลาด', detail: response.data },
          response.status,
        );
      } else if (axiosError.request) {
        // เคสที่ยิงไปแล้วไม่มีใครตอบกลับ (เช่น Timeout, Server ล่ม)
        this.logger.error('API No Response (Timeout or Down)');
        throw new HttpException('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ (Timeout)', HttpStatus.GATEWAY_TIMEOUT);
      }
    }

    // กรณี Error อื่นๆ ที่ไม่คาดคิด
    this.logger.error(`Unexpected Error: ${error.message}`);
    throw new HttpException('เกิดข้อผิดพลาดภายในระบบ', HttpStatus.INTERNAL_SERVER_ERROR);
  }
}
