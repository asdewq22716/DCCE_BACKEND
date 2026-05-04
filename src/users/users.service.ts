import { Injectable, UnauthorizedException, BadRequestException, Logger, Inject, forwardRef } from '@nestjs/common';
import { FncDB } from 'src/common/services/fnc-db.service';
import { PermissionsService } from 'src/permissions/permissions.service';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly db: FncDB,
    private readonly permissionsService: PermissionsService,
  ) { }


  async getUserRoleByUserId(user_id: number): Promise<any[]> {
    try {
      const roles = await this.db.query(
        `select c.role_id, c.role_name, c.description from users a 
        join user_roles b on a.user_id = b.user_id 
        join roles c on b.role_id = c.role_id 
        where a.user_id = $1`,
        [user_id]);
      if (roles.length === 0) {
        throw new UnauthorizedException('บัญชีผู้ใช้งานนี้ไม่ได้รับอนุญาตให้เข้าใช้งาน');
      }

      return roles;

    } catch (err: any) {
      if (err instanceof UnauthorizedException) throw err;
      this.logger.error(`Get user role by user id error: ${err.message}`);
      throw new BadRequestException('ไม่สามารถตรวจสอบสิทธิ์การเข้าใช้งานได้');
    }
  }

  async getUserById(userId: number) {
    const users = await this.db.select<any>('users', {
      user_id: userId
    });
    if (users.length === 0) {
      throw new Error('User not found');
    }
    const roles = await this.getUserRoleByUserId(userId);

    return {
      user: {
        user_id: users[0].user_id,
        sso_userid: users[0].sso_userid,
        sso_username: users[0].sso_username,
        sso_token: users[0].sso_token,
        sso_idcard_no: users[0].sso_idcard_no,
        sso_email: users[0].sso_email,
        sso_prefix_name: users[0].sso_prefix_name,
        sso_firstname: users[0].sso_firstname,
        sso_lastname: users[0].sso_lastname,
        sso_work_position_text: users[0].sso_work_position_text,
        sso_work_place_text: users[0].sso_work_place_text,
        sso_work_place_id: users[0].sso_work_place_id,
        sso_work_place_name: users[0].sso_work_place_name,
        sso_work_place_type_id: users[0].sso_work_place_type_id,
        sso_work_place_type_name: users[0].sso_work_place_type_name,
        sso_division_id: users[0].sso_division_id,
        sso_division_name: users[0].sso_division_name,
        sso_sub_division_id: users[0].sso_sub_division_id,
        sso_sub_division_name: users[0].sso_sub_division_name,
        full_name: users[0].full_name,
        is_active: users[0].is_active,
        last_login: users[0].last_login,
      },
      roles: roles
    };
  }
}
