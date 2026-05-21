/**
 * ==========================================
 * 📂 fnc-custom.ts - คลาสอำนวยความสะดวกส่วนกลางของระบบ
 * ==========================================
 */
export class FncCustom {
  /**
   * ดึงวันเวลาปัจจุบันของระบบ (สำหรับใช้แทน new Date())
   * @returns Date
   */
  static dateNow(): Date {
    return new Date();
  }

  /**
   * ดึงวันเวลาปัจจุบันในรูปแบบ ISO String (สำหรับใช้แทน new Date().toISOString())
   * @returns string เช่น '2026-05-19T07:20:00.000Z'
   */
  static dateNowISOString(): string {
    return new Date().toISOString();
  }

  /**
   * ดึง AuditContext จาก Request object
   * @param req Request
   * @returns AuditContext
   */
  static getAuditContext(req: any) {
    return {
      userId: req.user?.userId || null,
      ipAddress: req.ip || req.connection?.remoteAddress || null,
      userAgent: req.headers['user-agent'] || null,
    };
  }
}
