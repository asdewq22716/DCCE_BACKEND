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

      let whereClause = '1=1';
      const params: any[] = [];
      let paramCounter = 1;

      if (query.moduleName) {
        whereClause += ` AND al.module_name = $${paramCounter++}`;
        params.push(query.moduleName);
      }

      if (query.actionType) {
        whereClause += ` AND al.action_type = $${paramCounter++}`;
        params.push(query.actionType);
      }

      if (query.recordId) {
        whereClause += ` AND al.record_id = $${paramCounter++}`;
        params.push(query.recordId);
      }

      if (query.createdBy) {
        whereClause += ` AND al.created_by = $${paramCounter++}`;
        params.push(query.createdBy);
      }

      if (query.startDate) {
        whereClause += ` AND al.created_at >= $${paramCounter++}`;
        params.push(query.startDate);
      }

      if (query.endDate) {
        whereClause += ` AND al.created_at <= $${paramCounter++}`;
        params.push(query.endDate);
      }

      if (query.search) {
        whereClause += ` AND (al.remark ILIKE $${paramCounter} OR al.module_name ILIKE $${paramCounter})`;
        params.push(`%${query.search}%`);
        paramCounter++;
      }

      // 1. ดึงจำนวนรายการทั้งหมดเพื่อคำนวณจำนวนหน้า
      const countQuery = `
        SELECT COUNT(*)::int as total 
        FROM audit_logs al 
        WHERE ${whereClause}
      `;
      const countResult = await this.db.query(countQuery, params);
      const totalItems = countResult[0]?.total || 0;

      // 2. ดึงรายการข้อมูล Log พร้อมดึง username ของคนทำรายการ
      const dataQuery = `
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
        WHERE ${whereClause}
        ORDER BY al.created_at DESC
        LIMIT $${paramCounter++} OFFSET $${paramCounter++}
      `;
      
      const selectParams = [...params, limit, offset];
      const items = await this.db.query(dataQuery, selectParams);
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
      throw new BadRequestException(`ไม่สามารถดึงข้อมูลประวัติกิจกรรมได้: ${err.message}`);
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
