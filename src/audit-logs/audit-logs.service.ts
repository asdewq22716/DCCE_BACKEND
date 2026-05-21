import { Injectable, BadRequestException } from '@nestjs/common';
import { FncDB } from 'src/common/services/fnc-db.service';
import { AuditLogQueryDto } from './dto/audit-log-query.dto';

@Injectable()
export class AuditLogsService {
  constructor(private readonly db: FncDB) {}

  /**
   * ดึงรายการประวัติกิจกรรมทั้งหมด พร้อมตัวกรองและการแบ่งหน้าแบบยืดหยุ่น
   */
  async findAll(query: AuditLogQueryDto) {
    try {
      const page = query.page && query.page > 0 ? query.page : 1;
      const limit = query.limit && query.limit > 0 ? query.limit : 10;
      const offset = (page - 1) * limit;

      // Escape ตัวแปรที่เป็นสตริงทั้งหมดเพื่อป้องกัน SQL syntax error และ sql injection
      const moduleName = this.db.escape(query.moduleName);
      const actionType = this.db.escape(query.actionType);
      const recordId = this.db.escape(query.recordId);
      const search = this.db.escape(query.search);
      const startDate = this.db.escape(query.startDate);
      const endDate = this.db.escape(query.endDate);
      const createdBy = query.createdBy; // เป็น number ไม่ต้อง escape สตริง

      const where = [
        {
          if: moduleName,
          fill: `al.module_name = '${moduleName}'`,
        },
        {
          if: actionType,
          fill: `al.action_type = '${actionType}'`,
        },
        {
          if: recordId,
          fill: `al.record_id = '${recordId}'`,
        },
        {
          if: createdBy,
          fill: `al.created_by = ${createdBy}`,
        },
        {
          if: startDate,
          fill: `al.created_at >= '${startDate}'`,
        },
        {
          if: endDate,
          fill: `al.created_at <= '${endDate}'`,
        },
        {
          if: search,
          fill: `(al.remark ILIKE '%${search}%' OR al.module_name ILIKE '%${search}%')`,
        },
      ];

      // 1. ดึงจำนวนรายการทั้งหมดเพื่อคำนวณจำนวนหน้า
      const countResult = await this.db.queryBuilder({
        select: 'SELECT COUNT(*)::int as total FROM audit_logs al',
        where,
      });
      const totalItems = countResult[0]?.total || 0;

      // 2. ดึงรายการข้อมูล Log พร้อมดึง username ของคนทำรายการ
      const items = await this.db.queryBuilder({
        select: `
          SELECT 
            al.log_id,
            al.created_by,
            u.username AS creator_username,
            al.action_type,
            al.module_name,
            al.record_id,
            al.old_data,
            al.new_data,
            al.remark,
            al.ip_address,
            al.user_agent,
            al.created_at
          FROM audit_logs al
          LEFT JOIN users u ON al.created_by = u.user_id
        `,
        where,
        orderBy: 'al.created_at DESC',
        limit,
        offset,
      });
      const totalPages = Math.ceil(totalItems / limit);

      return {
        data: items,
        meta: {
          totalItems,
          itemCount: items.length,
          itemsPerPage: limit,
          totalPages,
          currentPage: page,
        },
      };
    } catch (err: any) {
      throw new BadRequestException(
        `ไม่สามารถดึงข้อมูลประวัติกิจกรรมได้: ${err.message}`,
      );
    }
  }

  /**
   * ดึงรายละเอียดกิจกรรมแยกเฉพาะเจาะจงรายตัว Log ID
   */
  async findOne(id: number) {
    const logRows = await this.db.query(
      `SELECT 
        al.log_id,
        al.created_by,
        u.username AS creator_username,
        al.action_type,
        al.module_name,
        al.record_id,
        al.old_data,
        al.new_data,
        al.remark,
        al.ip_address,
        al.user_agent,
        al.created_at
      FROM audit_logs al
      LEFT JOIN users u ON al.created_by = u.user_id
      WHERE al.log_id = $1`,
      [id],
    );

    if (logRows.length === 0) {
      throw new BadRequestException('ไม่พบข้อมูล Log ที่ระบุ');
    }

    return logRows[0];
  }
}
