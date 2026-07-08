export class MailFormat {
  /**
   * แบบฟอร์มสำหรับติดต่อสอบถามแอดมิน (Contact Admin)
   */
  static buildContactAdminHtml(title: string, message: string, senderName: string = 'ผู้ใช้งานระบบ', senderEmail: string = '-'): string {
    const timestamp = new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' });
    
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
        <!-- Header -->
        <div style="background-color: #2b6cb0; color: white; padding: 20px; text-align: center;">
          <h2 style="margin: 0; font-size: 24px;">✉️ ข้อความติดต่อสอบถามจากผู้ใช้งาน</h2>
        </div>
        
        <!-- Content -->
        <div style="padding: 24px; background-color: #ffffff;">
          <h3 style="color: #333333; margin-top: 0; border-bottom: 2px solid #f0f0f0; padding-bottom: 10px;">
            หัวข้อ: ${title}
          </h3>
          
          <div style="margin: 20px 0; padding: 15px; background-color: #f0f7ff; border-left: 4px solid #2b6cb0; border-radius: 4px;">
            <p style="margin: 0; color: #444444; line-height: 1.6; white-space: pre-wrap;">${message}</p>
          </div>
          
          <table style="width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 14px;">
            <tr>
              <td style="padding: 10px 0; color: #777777; width: 140px;"><strong>จากผู้ส่ง:</strong></td>
              <td style="padding: 10px 0; color: #333333;">${senderName}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; color: #777777; width: 140px;"><strong>อีเมลติดต่อกลับ:</strong></td>
              <td style="padding: 10px 0; color: #333333;">${senderEmail}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; color: #777777; width: 140px;"><strong>วัน-เวลาที่ส่ง:</strong></td>
              <td style="padding: 10px 0; color: #333333;">${timestamp}</td>
            </tr>
          </table>
        </div>
        
        <!-- Footer -->
        <div style="background-color: #f4f4f4; padding: 15px; text-align: center; color: #888888; font-size: 12px; border-top: 1px solid #e0e0e0;">
          <p style="margin: 0;">อีเมลฉบับนี้เป็นการส่งข้อความอัตโนมัติจากระบบ DCCE Backend</p>
        </div>
      </div>
    `;
  }
}
