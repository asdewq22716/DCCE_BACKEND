import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { FncDB } from '../common/services/fnc-db.service';
import { AuditLogService } from '../common/services/audit-log.service';
import { CreateApiRequestDto } from './dto/create-api-request.dto';
import { UpdateApiRequestDto, UpdateApiRequestStatusDto } from './dto/update-api-request.dto';
import { ApiRequestQueryDto } from './dto/api-request-query.dto';
import { ApprovalsService } from '../approvals/approvals.service';

@Injectable()
export class ApiRequestsService {
  private readonly logger = new Logger(ApiRequestsService.name);

  constructor(
    private readonly db: FncDB,
    private readonly auditLogService: AuditLogService,
    private readonly approvalsService: ApprovalsService,
  ) { }

  async findAll(query: ApiRequestQueryDto) {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? query.limit : 10;
    const offset = (page - 1) * limit;

    const status = this.db.escape(query.status);
    const branch_id = query.branch_id;
    const division_id = query.division_id;
    const start_date = this.db.escape(query.start_date);
    const end_date = this.db.escape(query.end_date);

    const where = [
      { fill: 'r.is_active = 1' },
      {
        if: status,
        fill: `r.status = '${status}'`,
      },
      {
        if: branch_id !== undefined,
        fill: `r.branch_id = ${branch_id}`,
      },
      {
        if: division_id !== undefined,
        fill: `r.division_id = ${division_id}`,
      },
      {
        if: start_date,
        fill: `r.created_at >= '${start_date} 00:00:00'`,
      },
      {
        if: end_date,
        fill: `r.created_at <= '${end_date} 23:59:59'`,
      },
    ];

    const fromAndJoins = `
      FROM api_requests r
      LEFT JOIN server_ips s ON r.server_ip_id = s.id
      LEFT JOIN organizations b ON r.branch_id = b.org_id
      LEFT JOIN organizations d ON r.division_id = d.org_id
    `;

    const selectCount = `SELECT COUNT(*)::int as total ${fromAndJoins}`;
    const totalResult = await this.db.queryBuilder({ select: selectCount, where });
    const totalItems = totalResult[0]?.total || 0;

    const selectData = `
      SELECT 
        r.*,
        s.ip_address AS server_ip_address,
        b.org_name AS branch_name,
        d.org_name AS division_name
      ${fromAndJoins}
    `;

    const items = await this.db.queryBuilder({
      select: selectData,
      where,
      orderBy: 'r.created_at DESC',
      limit,
      offset,
    });

    // ดึง Approval Logs สำหรับทุกรายการใน List แบบ Batch เพื่อไม่ให้เกิด N+1 Query
    if (items.length > 0) {
      const itemIds = items.map(item => item.id.toString());
      const placeholders = itemIds.map((_, i) => `$${i + 1}`).join(',');

      const logsSql = `
        SELECT al.*, a.ref_id
        FROM approval_logs al
        JOIN approvals a ON al.approval_id = a.id
        WHERE a.ref_table = 'api_requests' AND a.ref_id IN (${placeholders})
        ORDER BY al.created_at ASC
      `;
      const allLogs = await this.db.query(logsSql, itemIds);

      // Map logs กลับไปใส่ในแต่ละ Item
      items.forEach(item => {
        item.approval_logs = allLogs.filter(log => log.ref_id === item.id.toString());
      });
    }

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
  }


  async findAllBackoffice(query: ApiRequestQueryDto, userId: string) {
    // 1. จัดการหน้า (Pagination)
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? query.limit : 10;
    const offset = (page - 1) * limit;

    // 2. จัดเตรียมเงื่อนไขการค้นหาพื้นฐาน (Filter by Form Data)
    const status = this.db.escape(query.status);
    const branch_id = query.branch_id;
    const division_id = query.division_id;
    const start_date = this.db.escape(query.start_date);
    const end_date = this.db.escape(query.end_date);

    const where: any[] = [
      { fill: 'r.is_active = 1' },
      { if: status, fill: `r.status = '${status}'` },
      { if: branch_id !== undefined, fill: `r.branch_id = ${branch_id}` },
      { if: division_id !== undefined, fill: `r.division_id = ${division_id}` },
      { if: start_date, fill: `r.created_at >= '${start_date} 00:00:00'` },
      { if: end_date, fill: `r.created_at <= '${end_date} 23:59:59'` },
    ];

    // 3. ตรวจสอบสิทธิ์ (RBAC Filtering)
    const emptyResult = {
      data: [],
      meta: { totalItems: 0, itemCount: 0, itemsPerPage: limit, totalPages: 0, currentPage: page },
    };

    // หากไม่ได้ Login (Anonymous) ให้เด้งออกทันที (ไม่ให้เห็นข้อมูล)
    if (userId === 'anonymous') return emptyResult;

    // ดึงสิทธิ์ของ User ปัจจุบัน
    const uId = parseInt(userId, 10);
    const roleSql = `SELECT role_id FROM user_roles WHERE user_id = $1`;
    const roles = await this.db.query(roleSql, [uId.toString()]);
    const roleIds = roles.map((r: any) => parseInt(r.role_id, 10));

    const isAdmin = roleIds.includes(1);
    const isSuperUser = roleIds.includes(2);

    if (isAdmin) {
      // [Role 1: Admin] สามารถมองเห็นข้อมูลได้ทั้งหมด (ผ่านฉลุย ไม่ต้องเพิ่มเงื่อนไข)
    } 
    else if (isSuperUser) {
      // [Role 2: Super User] มองเห็นเฉพาะข้อมูลขององค์กรหลักของตัวเอง
      const orgSql = `SELECT org_id FROM user_organizations WHERE user_id = $1 AND is_primary = 1`;
      const orgs = await this.db.query(orgSql, [uId.toString()]);
      
      // ถ้าไม่มีองค์กรหลัก คืนค่าตารางว่างกลับไปทันที
      if (orgs.length === 0) return emptyResult;

      const orgId = orgs[0].org_id;
      where.push({ fill: `(r.branch_id = ${orgId} OR r.division_id = ${orgId})` });
    } 
    else {
      // [Role อื่นๆ] ไม่อนุญาตให้มองเห็นข้อมูลในส่วนหลังบ้าน เด้งออกทันที
      return emptyResult;
    }

    // 5. Query ข้อมูล
    const fromAndJoins = `
      FROM api_requests r
      LEFT JOIN server_ips s ON r.server_ip_id = s.id
      LEFT JOIN organizations b ON r.branch_id = b.org_id
      LEFT JOIN organizations d ON r.division_id = d.org_id
    `;

    const selectCount = `SELECT COUNT(*)::int as total ${fromAndJoins}`;
    const totalResult = await this.db.queryBuilder({ select: selectCount, where });
    const totalItems = totalResult[0]?.total || 0;

    const selectData = `
      SELECT 
        r.*,
        s.ip_address AS server_ip_address,
        b.org_name AS branch_name,
        d.org_name AS division_name
      ${fromAndJoins}
    `;

    const items = await this.db.queryBuilder({
      select: selectData,
      where,
      orderBy: 'r.created_at DESC',
      limit,
      offset,
    });

    if (items.length > 0) {
      const itemIds = items.map((item: any) => item.id.toString());
      const placeholders = itemIds.map((_, i) => `$${i + 1}`).join(',');

      const logsSql = `
        SELECT al.*, a.ref_id
        FROM approval_logs al
        JOIN approvals a ON al.approval_id = a.id
        WHERE a.ref_table = 'api_requests' AND a.ref_id IN (${placeholders})
        ORDER BY al.created_at ASC
      `;
      const allLogs = await this.db.query(logsSql, itemIds);

      items.forEach((item: any) => {
        item.approval_logs = allLogs.filter((log: any) => log.ref_id === item.id.toString());
      });
    }

    return {
      data: items,
      meta: {
        totalItems,
        itemCount: items.length,
        itemsPerPage: limit,
        totalPages: Math.ceil(totalItems / limit),
        currentPage: page,
      },
    };
  }
  async findOne(id: number) {
    const selectData = `
      SELECT 
        r.*,
        s.ip_address AS server_ip_address,
        b.org_name AS branch_name,
        d.org_name AS division_name
      FROM api_requests r
      LEFT JOIN server_ips s ON r.server_ip_id = s.id
      LEFT JOIN organizations b ON r.branch_id = b.org_id
      LEFT JOIN organizations d ON r.division_id = d.org_id
    `;
    const items = await this.db.queryBuilder({
      select: selectData,
      where: [{ fill: `r.id = ${id}` }, { fill: 'r.is_active = 1' }],
    });
    if (items.length === 0) {
      throw new NotFoundException('ไม่พบข้อมูลคำขอใช้งาน API');
    }

    const requestData = items[0];

    // ดึงประวัติการอนุมัติ (Approval Logs) พร้อมคอมเมนต์ของแอดมิน แนบกลับไปด้วย
    const logsSql = `
      SELECT al.* 
      FROM approval_logs al
      JOIN approvals a ON al.approval_id = a.id
      WHERE a.ref_table = 'api_requests' AND a.ref_id = $1
      ORDER BY al.created_at DESC
    `;
    const approvalLogs = await this.db.query(logsSql, [id.toString()]);
    requestData.approval_logs = approvalLogs;

    return requestData;
  }

  async create(createDto: CreateApiRequestDto, userId: string) {
    const client = await this.db.startTransaction();
    try {
      const year = new Date().getFullYear();

      // Generate Request ID
      let newRequestId = `API-${year}-001`;
      const sqlLatest = `SELECT request_id FROM api_requests WHERE request_id LIKE 'API-${year}-%' ORDER BY id DESC LIMIT 1 FOR UPDATE`;
      const latestReq = await this.db.queryTx(client, sqlLatest);
      if (latestReq.length > 0) {
        const parts = latestReq[0].request_id.split('-');
        if (parts.length === 3) {
          const num = parseInt(parts[2], 10) + 1;
          newRequestId = `API-${year}-${num.toString().padStart(3, '0')}`;
        }
      }

      const data: any = {
        request_id: newRequestId,
        branch_id: createDto.branch_id,
        division_id: createDto.division_id,
        created_by: parseInt(userId, 10) || 0,
        updated_by: parseInt(userId, 10) || 0,
      };

      if (createDto.app_url !== undefined) data.app_url = createDto.app_url;
      if (createDto.sys_web_app !== undefined) data.sys_web_app = createDto.sys_web_app;
      if (createDto.sys_mobile_app !== undefined) data.sys_mobile_app = createDto.sys_mobile_app;
      if (createDto.sys_server_to_server !== undefined) data.sys_server_to_server = createDto.sys_server_to_server;
      if (createDto.objective_text !== undefined) data.objective_text = createDto.objective_text;
      if (createDto.api_climate_data !== undefined) data.api_climate_data = createDto.api_climate_data;
      if (createDto.api_station_data !== undefined) data.api_station_data = createDto.api_station_data;
      if (createDto.api_statistics_report !== undefined) data.api_statistics_report = createDto.api_statistics_report;
      if (createDto.api_climate_map !== undefined) data.api_climate_map = createDto.api_climate_map;
      if (createDto.server_ip_id !== undefined) data.server_ip_id = createDto.server_ip_id;
      if (createDto.callback_url !== undefined) data.callback_url = createDto.callback_url;
      if (createDto.environment !== undefined) data.environment = createDto.environment;
      if (createDto.comment !== undefined) data.comment = createDto.comment;

      const newItem = await this.db.insert('api_requests', data, client);

      await this.auditLogService.log(
        client,
        {
          actionType: 'CREATE',
          moduleName: 'api_requests',
          recordId: newItem.id.toString(),
          newData: newItem,
          remark: 'สร้างคำขอใช้งาน API ใหม่',
        },
        { userId: parseInt(userId, 10) || 0 },
      );

      // ส่งงานเข้า Inbox ระบบอนุมัติส่วนกลาง
      await this.approvalsService.createApproval({
        ref_table: 'api_requests',
        ref_id: newItem.id.toString(),
        title: `คำขอเชื่อมต่อ API: ${newRequestId}`,
        payload: {
          request_id: newRequestId,
          app_url: newItem.app_url,
          environment: newItem.environment,
          objective_text: newItem.objective_text
        },
        required_role: 'super_admin', // ใครเป็น super_admin ก็สามารถอนุมัติได้
        requester_id: userId
      }, client);

      await this.db.commit(client);
      return { success: true, message: 'บันทึกคำขอและส่งเรื่องให้อนุมัติเรียบร้อย', data: newItem };
    } catch (err: any) {
      await this.db.rollback(client);
      this.logger.error(`Failed to create: ${err.message}`, err.stack);
      throw new BadRequestException(`ไม่สามารถสร้างคำขอได้: ${err.message}`);
    }
  }

  async update(id: number, updateDto: UpdateApiRequestDto, userId: string) {
    const oldItem = await this.findOne(id);

    const client = await this.db.startTransaction();
    try {
      const data: any = {};
      if (updateDto.branch_id !== undefined) data.branch_id = updateDto.branch_id;
      if (updateDto.division_id !== undefined) data.division_id = updateDto.division_id;
      if (updateDto.app_url !== undefined) data.app_url = updateDto.app_url;
      if (updateDto.sys_web_app !== undefined) data.sys_web_app = updateDto.sys_web_app;
      if (updateDto.sys_mobile_app !== undefined) data.sys_mobile_app = updateDto.sys_mobile_app;
      if (updateDto.sys_server_to_server !== undefined) data.sys_server_to_server = updateDto.sys_server_to_server;
      if (updateDto.objective_text !== undefined) data.objective_text = updateDto.objective_text;
      if (updateDto.api_climate_data !== undefined) data.api_climate_data = updateDto.api_climate_data;
      if (updateDto.api_station_data !== undefined) data.api_station_data = updateDto.api_station_data;
      if (updateDto.api_statistics_report !== undefined) data.api_statistics_report = updateDto.api_statistics_report;
      if (updateDto.api_climate_map !== undefined) data.api_climate_map = updateDto.api_climate_map;
      if (updateDto.server_ip_id !== undefined) data.server_ip_id = updateDto.server_ip_id;
      if (updateDto.callback_url !== undefined) data.callback_url = updateDto.callback_url;
      if (updateDto.environment !== undefined) data.environment = updateDto.environment;
      if (updateDto.comment !== undefined) data.comment = updateDto.comment;

      if (Object.keys(data).length === 0) {
        throw new BadRequestException('ไม่มีข้อมูลที่ต้องการอัปเดต');
      }

      data.updated_at = new Date();
      data.updated_by = parseInt(userId, 10) || 0;

      await this.db.update('api_requests', data, { id }, client);
      const updatedItem = { ...oldItem, ...data };

      await this.auditLogService.log(
        client,
        {
          actionType: 'UPDATE',
          moduleName: 'api_requests',
          recordId: id.toString(),
          oldData: oldItem,
          newData: updatedItem,
          remark: 'อัปเดตข้อมูลคำขอใช้งาน API',
        },
        { userId: parseInt(userId, 10) || 0 },
      );

      await this.db.commit(client);
      return { success: true, message: 'อัปเดตข้อมูลสำเร็จ', data: updatedItem };
    } catch (err: any) {
      await this.db.rollback(client);
      this.logger.error(`Failed to update: ${err.message}`, err.stack);
      throw new BadRequestException(`ไม่สามารถอัปเดตข้อมูลได้: ${err.message}`);
    }
  }

  async updateStatus(id: number, updateDto: UpdateApiRequestStatusDto, userId: string) {
    const oldItem = await this.findOne(id);

    // 1. ค้นหาว่ามีงานรออนุมัติอยู่ในตารางกลาง (Approvals) หรือไม่
    const approvalSql = `SELECT id FROM approvals WHERE ref_table = 'api_requests' AND ref_id = $1 AND status = 'pending' LIMIT 1`;
    const pendingTasks = await this.db.query(approvalSql, [id.toString()]);

    if (pendingTasks && pendingTasks.length > 0) {
      // 2. ถ้ามีงานใน Inbox ให้ไปใช้ระบบ Approvals จัดการแทน (ซึ่งมันจะกลับมาอัปเดต api_requests ให้อัตโนมัติ)
      const action = updateDto.status === 'approved' ? 'approved' : 'rejected';
      await this.approvalsService.actionApproval(pendingTasks[0].id, { action, comment: updateDto.comment }, userId);

      return {
        success: true,
        message: `บันทึกการอนุมัติเป็น ${updateDto.status} สำเร็จผ่านระบบ Approvals กลาง`,
        data: { ...oldItem, status: updateDto.status }
      };
    }

    // 3. Fallback: ถ้าไม่มีงานในตารางกลาง (เช่น เป็นข้อมูลเก่า) ให้อัปเดตตารางตรงๆ แบบเดิม
    const client = await this.db.startTransaction();
    try {
      const data = {
        status: updateDto.status,
        updated_at: new Date(),
        updated_by: parseInt(userId, 10) || 0,
      };

      await this.db.update('api_requests', data, { id }, client);
      const updatedItem = { ...oldItem, ...data };

      await this.auditLogService.log(
        client,
        {
          actionType: 'UPDATE',
          moduleName: 'api_requests',
          recordId: id.toString(),
          oldData: oldItem,
          newData: updatedItem,
          remark: `เปลี่ยนสถานะคำขอใช้งาน API เป็น ${updateDto.status}`,
        },
        { userId: parseInt(userId, 10) || 0 },
      );

      await this.db.commit(client);
      return { success: true, message: 'เปลี่ยนสถานะสำเร็จ', data: updatedItem };
    } catch (err: any) {
      await this.db.rollback(client);
      this.logger.error(`Failed to update status: ${err.message}`, err.stack);
      throw new BadRequestException(`ไม่สามารถเปลี่ยนสถานะได้: ${err.message}`);
    }
  }

  async remove(id: number, userId: string) {
    const oldItem = await this.findOne(id);

    const client = await this.db.startTransaction();
    try {
      const data = {
        is_active: 0,
        updated_at: new Date(),
        updated_by: parseInt(userId, 10) || 0,
      };

      await this.db.update('api_requests', data, { id }, client);

      await this.auditLogService.log(
        client,
        {
          actionType: 'DELETE',
          moduleName: 'api_requests',
          recordId: id.toString(),
          oldData: oldItem,
          remark: 'ลบคำขอใช้งาน API (Soft Delete)',
        },
        { userId: parseInt(userId, 10) || 0 },
      );

      await this.db.commit(client);
      return { success: true, message: 'ลบข้อมูลสำเร็จ' };
    } catch (err: any) {
      await this.db.rollback(client);
      this.logger.error(`Failed to delete: ${err.message}`, err.stack);
      throw new BadRequestException(`ไม่สามารถลบข้อมูลได้: ${err.message}`);
    }
  }
}
