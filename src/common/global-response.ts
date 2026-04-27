import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { map } from 'rxjs/operators';

/**
 * 1. ส่วนสำหรับจัดการ ERROR (Exception Filter)
 * ทำหน้าที่: เมื่อเกิด Error ในระบบ จะจับมาใส่กล่อง JSON รูปแบบเดียวกัน
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    // ดึง Status Code ออกมา (ถ้าไม่มีให้เป็น 500 - Internal Server Error)
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    // จัดรูปแบบ Error Message
    const message = exception.response?.message || exception.message || 'Internal Server Error';

    /**
     * ตัวอย่าง Status Code ที่พบบ่อย:
     * 400 (Bad Request) - ข้อมูลที่ส่งมาไม่ถูกต้อง
     * 401 (Unauthorized) - ไม่ได้ล็อกอิน หรือ Token ผิด
     * 403 (Forbidden) - ไม่มีสิทธิ์เข้าถึง
     * 404 (Not Found) - ไม่พบ URL หรือข้อมูล
     * 500 (Internal Error) - ระบบพัง หรือ SQL ผิด
     */

    response.status(status).json({
      status: status,           // รหัสสถานะ (ตัวเลข)
      success: false,           // แจ้งว่าทำงาน "ไม่สำเร็จ"
      message: message,         // ข้อความอธิบายความผิดพลาด
      error: exception.name,    // ชื่อประเภทของ Error
      path: request.url,        // URL ที่เกิดปัญหา
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * 2. ส่วนสำหรับจัดการข้อมูลสำเร็จ (Success Interceptor)
 * ทำหน้าที่: เมื่อ Service ทำงานสำเร็จ จะเอาข้อมูลมาครอบด้วยโครงสร้าง JSON มาตรฐาน
 */
@Injectable()
export class TransformInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    return next.handle().pipe(
      map((data) => {
        /**
         * ตัวอย่าง Status Code ฝั่งสำเร็จ:
         * 200 (OK) - ทำงานสำเร็จ
         * 201 (Created) - สร้างข้อมูลใหม่สำเร็จ
         */
        const statusCode = context.switchToHttp().getResponse().statusCode;

        return {
          status: statusCode,    // รหัสสถานะ (ตัวเลข)
          success: true,         // แจ้งว่าทำงาน "สำเร็จ"
          message: 'Success',    // ข้อความแจ้งสถานะ
          data: data,            // ข้อมูลจริงที่ได้จาก Service
        };
      }),
    );
  }
}
