import { Controller, Get, UseGuards, Param } from '@nestjs/common';
import { ApiOperation, ApiTags, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { UsersService } from 'src/users/users.service';

@ApiTags('Employee')
@Controller('employee')
export class EmployeeController {
  constructor(private readonly usersService: UsersService) { }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get employee basic info by ID' })
  @ApiParam({ name: 'id', example: 1, description: 'ID ของพนักงาน' })
  async getEmployeeInfo(@Param('id') id: number) {
    const userId = Number(id);
    const { user, roles } = await this.usersService.getUserById(userId);
    const organizations = await this.usersService.getEmployeeOrganizationsByUserId(userId);

    const mainRole = roles.length > 0 ? roles[0] : null;

    const primaryOrg = organizations.find((org: any) => org.is_primary === 1);
    
    let main_department = null;
    let branch = null;

    if (primaryOrg) {
      if (primaryOrg.level === 1) {
        main_department = { id: primaryOrg.org_id, name: primaryOrg.org_name };
      } else if (primaryOrg.level === 2) {
        branch = { id: primaryOrg.org_id, name: primaryOrg.org_name };
        if (primaryOrg.parent_id) {
          main_department = { id: primaryOrg.parent_id, name: primaryOrg.parent_org_name };
        }
      }
    }

    return {
      id: user.user_id,
      firstName: user.sso_firstname,
      lastName: user.sso_lastname,
      email: user.sso_email,
      main_department: main_department,
      branch: branch,
      role: mainRole,
    };
  }
}
