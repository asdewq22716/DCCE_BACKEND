import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly configService: ConfigService) {
    // กำหนดค่า SMTP จาก Environment Variables
    const host = this.configService.get<string>('SMTP_HOST') || 'smtp.gmail.com';
    const port = this.configService.get<number>('SMTP_PORT') || 587;
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASS');

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465, // true สำหรับ 465, false สำหรับพอร์ตอื่นๆ (เช่น 587)
      auth: {
        user,
        pass,
      },
    });
  }

  /**
   * ฟังก์ชันแกนกลางสำหรับส่งอีเมล (รับ HTML ที่ปั้นมาแล้ว)
   * @param to อีเมลผู้รับ
   * @param subject หัวข้ออีเมล
   * @param htmlContent เนื้อหาอีเมลในรูปแบบ HTML
   */
  async sendMail(to: string, subject: string, htmlContent: string): Promise<boolean> {
    try {
      // ตรวจสอบว่ามีการตั้งค่า User/Pass หรือไม่ หากไม่มีให้แค่ Log ไว้ (ป้องกันแอปพังถ้ายังไม่ตั้งค่า)
      const user = this.configService.get<string>('SMTP_USER');
      if (!user || user === 'your_email@gmail.com') {
        this.logger.warn(`SMTP credentials not configured properly. Simulating email send to ${to}`);
        this.logger.debug(`[Simulated Email] Subject: ${subject}`);
        return true;
      }

      const mailOptions = {
        from: `"DCCE Notification" <${user}>`, // ชื่อและอีเมลผู้ส่ง
        to, // อีเมลผู้รับ (สามารถใส่หลายอีเมลคั่นด้วยลูกน้ำได้)
        subject,
        html: htmlContent,
      };

      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(`Email sent successfully to ${to} (Message ID: ${info.messageId})`);
      return true;
    } catch (error: any) {
      this.logger.error(`Failed to send email to ${to}: ${error.message}`, error.stack);
      // ไม่ throw error ออกไป เพื่อไม่ให้ Flow หลักของแอปหยุดทำงาน แค่ return false
      return false;
    }
  }
}
