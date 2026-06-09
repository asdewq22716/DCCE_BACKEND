import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { FncDB } from '../common/services/fnc-db.service';
import { AuditLogService } from '../common/services/audit-log.service';
import { CreateSystemServiceDto } from './dto/create-system-service.dto';
import { UpdateSystemServiceDto } from './dto/update-system-service.dto';

@Injectable()
export class SystemServicesService {
  private readonly logger = new Logger(SystemServicesService.name);

  constructor(
    private readonly db: FncDB,
    private readonly auditLogService: AuditLogService,
  ) {}

  async create(createDto: CreateSystemServiceDto, userId: string) {
    const client = await this.db.startTransaction();
    try {
      const data = {
        name: createDto.name,
        remark: createDto.remark || null,
        permission_by_org: createDto.permission_by_org || 0,
        permission_by_role: createDto.permission_by_role || 0,
        manage_external_permission: createDto.manage_external_permission || 0,
        manage_system_service: createDto.manage_system_service || 0,
        view_change_history: createDto.view_change_history || 0,
        is_active: createDto.is_active ?? 1,
        created_by: userId,
        updated_by: userId
      };

      const record = await this.db.insert('system_services', data, client);

      await this.auditLogService.log(client, {
        actionType: 'CREATE',
        moduleName: 'system_services',
        recordId: record.id.toString(),
        newData: data,
        remark: 'เพิ่มข้อมูล Service ของระบบ'
      }, { userId: parseInt(userId, 10) || 0 });

      await this.db.commit(client);
      return { success: true, id: record.id, message: 'บันทึกข้อมูลสำเร็จ' };

    } catch (error: any) {
      await this.db.rollback(client);
      this.logger.error(`Failed to create system service: ${error.message}`, error.stack);
      throw new BadRequestException('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    }
  }

  async findAll() {
    const sql = `
      SELECT * FROM system_services
      WHERE deleted_at IS NULL
      ORDER BY id ASC
    `;
    return await this.db.query(sql);
  }

  async findOne(id: number) {
    const sql = `
      SELECT * FROM system_services
      WHERE id = $1 AND deleted_at IS NULL
    `;
    const result = await this.db.query(sql, [id]);

    if (!result || result.length === 0) {
      throw new NotFoundException('ไม่พบข้อมูล Service นี้ในระบบ');
    }

    return result[0];
  }

  async update(id: number, updateDto: UpdateSystemServiceDto, userId: string) {
    const oldRecord = await this.findOne(id);
    const client = await this.db.startTransaction();

    try {
      const updateData: any = { ...updateDto };
      updateData.updated_by = userId;
      updateData.updated_at = new Date();

      await this.db.update('system_services', updateData, { id }, client);

      await this.auditLogService.log(client, {
        actionType: 'UPDATE',
        moduleName: 'system_services',
        recordId: id.toString(),
        oldData: oldRecord,
        newData: updateData,
        remark: 'แก้ไขข้อมูล Service ของระบบ'
      }, { userId: parseInt(userId, 10) || 0 });

      await this.db.commit(client);
      return { success: true, message: 'อัปเดตข้อมูลสำเร็จ' };

    } catch (error: any) {
      await this.db.rollback(client);
      this.logger.error(`Failed to update system service: ${error.message}`, error.stack);
      throw new BadRequestException(`เกิดข้อผิดพลาดในการอัปเดต: ${error.message}`);
    }
  }

  async remove(id: number, userId: string) {
    const oldRecord = await this.findOne(id);
    const client = await this.db.startTransaction();
    
    try {
      await this.db.update('system_services', {
        is_active: 0,
        deleted_at: new Date(),
        deleted_by: userId
      }, { id }, client);

      await this.auditLogService.log(client, {
        actionType: 'DELETE',
        moduleName: 'system_services',
        recordId: id.toString(),
        oldData: oldRecord,
        remark: 'ลบข้อมูล Service (Soft Delete)'
      }, { userId: parseInt(userId, 10) || 0 });

      await this.db.commit(client);
      return { success: true, message: 'ลบข้อมูลสำเร็จ' };
    } catch (error: any) {
      await this.db.rollback(client);
      this.logger.error(`Failed to delete system service: ${error.message}`, error.stack);
      throw new BadRequestException(`เกิดข้อผิดพลาดในการลบข้อมูล: ${error.message}`);
    }
  }
}
