import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { FncDB } from '../common/services/fnc-db.service';
import { AuditLogService } from '../common/services/audit-log.service';
import { CreateApiRequestDto } from './dto/create-api-request.dto';
import { UpdateApiRequestDto, UpdateApiRequestStatusDto } from './dto/update-api-request.dto';
import { ApiRequestQueryDto } from './dto/api-request-query.dto';

@Injectable()
export class ApiRequestsService {
  private readonly logger = new Logger(ApiRequestsService.name);

  constructor(
    private readonly db: FncDB,
    private readonly auditLogService: AuditLogService,
  ) { }

  async findAll(query: ApiRequestQueryDto) {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? query.limit : 10;
    const offset = (page - 1) * limit;

    const search = this.db.escape(query.search);
    const status = this.db.escape(query.status);

    const where = [
      { fill: 'r.is_active = 1' },
      {
        if: search,
        fill: `(b.org_name ILIKE '%${search}%' OR d.org_name ILIKE '%${search}%' OR r.request_id ILIKE '%${search}%')`,
      },
      {
        if: status,
        fill: `r.status = '${status}'`,
      },
    ];

    const selectCount = 'SELECT COUNT(*)::int as total FROM api_requests r';
    const totalResult = await this.db.queryBuilder({ select: selectCount, where });
    const totalItems = totalResult[0]?.total || 0;

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
      where,
      orderBy: 'r.created_at DESC',
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
    return items[0];
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

      await this.db.commit(client);
      return { success: true, message: 'บันทึกคำขอสำเร็จ', data: newItem };
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
