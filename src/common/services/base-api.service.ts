import { HttpService } from '@nestjs/axios';
import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { AxiosError, AxiosRequestConfig } from 'axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class BaseApiService {
  protected readonly logger = new Logger(BaseApiService.name);

  constructor(protected readonly httpService: HttpService) { }

  /**
   * Hook สำหรับให้ Class ลูก (เช่น AuthService) ส่ง Header/Config พื้นฐานเข้ามาได้
   */
  protected getDefaultConfig(): AxiosRequestConfig {
    return {}; // ค่าตั้งต้นคือว่างเปล่า ให้ Class ลูกไป Override เอาเอง
  }

  /**
   * ฟังก์ชันแกนกลางสำหรับยิง API ทุกรูปแบบ (GET, POST, PUT, DELETE)
   */
  protected async request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    try {
      // รวม Config มาตรฐานของ Class เข้ากับ Config ที่ส่งมาเฉพาะกิจ
      const finalConfig: AxiosRequestConfig = {
        ...this.getDefaultConfig(),
        ...config,
        method,
        url,
        data,
      };

      const response = await firstValueFrom(this.httpService.request<T>(finalConfig));
      return response.data;
    } catch (error) {
      this.handleApiError(error);
    }
  }

  // --- Helper Methods เพื่อให้เรียกใช้งานได้ง่ายๆ ---

  async get<T>({ url, config }: { url: string; config?: AxiosRequestConfig }): Promise<T> {
    return this.request<T>('GET', url, undefined, config);
  }

  async post<T>({ url, data, config }: { url: string; data?: any; config?: AxiosRequestConfig }): Promise<T> {
    return this.request<T>('POST', url, data, config);
  }

  async put<T>({ url, data, config }: { url: string; data?: any; config?: AxiosRequestConfig }): Promise<T> {
    return this.request<T>('PUT', url, data, config);
  }

  async delete<T>({ url, config }: { url: string; config?: AxiosRequestConfig }): Promise<T> {
    return this.request<T>('DELETE', url, undefined, config);
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
