import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { FncDB } from '../../common/services/fnc-db.service';
import { AuditLogService } from '../../common/services/audit-log.service';
import { CreateServerIpDto } from './dto/create-server-ip.dto';
import { UpdateServerIpDto } from './dto/update-server-ip.dto';

@Injectable()
export class ServerIpsService {
  private readonly logger = new Logger(ServerIpsService.name);

  constructor(
    private readonly db: FncDB,
    private readonly auditLogService: AuditLogService,
  ) { }

  async findAll() {
    return await this.db.queryBuilder({
      select: 'SELECT * FROM server_ips',
      where: [{ fill: 'is_active = 1' }],
      orderBy: 'id ASC',
    });
  }

  async findOne(id: number) {
    const items = await this.db.queryBuilder({
      select: 'SELECT * FROM server_ips',
      where: [{ fill: `id = ${id}` }, { fill: 'is_active = 1' }],
    });
    if (items.length === 0) {
      throw new NotFoundException('ไม่พบข้อมูล Server IP');
    }
    return items[0];
  }

  async create(createDto: CreateServerIpDto, userId: string) {
    const client = await this.db.startTransaction();
    try {
      const data = {
        ip_address: createDto.ip_address,
        is_active: createDto.is_active !== undefined ? createDto.is_active : 1,
        created_by: parseInt(userId, 10) || 0,
        updated_by: parseInt(userId, 10) || 0,
      };

      const newItem = await this.db.insert('server_ips', data, client);

      await this.auditLogService.log(
        client,
        {
          actionType: 'CREATE',
          moduleName: 'server_ips',
          recordId: newItem.id.toString(),
          newData: newItem,
          remark: 'สร้างข้อมูล Server IP',
        },
        { userId: parseInt(userId, 10) || 0 },
      );

      await this.db.commit(client);
      return { success: true, message: 'สร้างข้อมูลสำเร็จ', data: newItem };
    } catch (err: any) {
      await this.db.rollback(client);
      this.logger.error(`Failed to create: ${err.message}`, err.stack);
      throw new BadRequestException(`ไม่สามารถสร้างข้อมูลได้: ${err.message}`);
    }
  }

  async update(id: number, updateDto: UpdateServerIpDto, userId: string) {
    const oldItem = await this.findOne(id);

    const client = await this.db.startTransaction();
    try {
      const data: any = {};
      if (updateDto.ip_address !== undefined) data.ip_address = updateDto.ip_address;
      if (updateDto.is_active !== undefined) data.is_active = updateDto.is_active;

      if (Object.keys(data).length === 0) {
        throw new BadRequestException('ไม่มีข้อมูลที่ต้องการอัปเดต');
      }

      data.updated_at = new Date();
      data.updated_by = parseInt(userId, 10) || 0;

      await this.db.update('server_ips', data, { id }, client);
      const updatedItem = { ...oldItem, ...data };

      await this.auditLogService.log(
        client,
        {
          actionType: 'UPDATE',
          moduleName: 'server_ips',
          recordId: id.toString(),
          oldData: oldItem,
          newData: updatedItem,
          remark: 'อัปเดตข้อมูล Server IP',
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

  async remove(id: number, userId: string) {
    const oldItem = await this.findOne(id);

    const client = await this.db.startTransaction();
    try {
      const data = {
        is_active: 0,
        updated_at: new Date(),
        updated_by: parseInt(userId, 10) || 0,
      };

      await this.db.update('server_ips', data, { id }, client);

      await this.auditLogService.log(
        client,
        {
          actionType: 'DELETE',
          moduleName: 'server_ips',
          recordId: id.toString(),
          oldData: oldItem,
          remark: 'ลบข้อมูล Server IP (Soft Delete)',
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
