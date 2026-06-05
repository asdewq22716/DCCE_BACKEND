import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { AssignPermissionsDto } from './dto/assign-permissions.dto';
import { FncCustom } from 'src/common/fnc-custom';

@ApiTags('Roles')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new role' })
  async create(@Body() dto: CreateRoleDto, @Req() req: any) {
    const context = FncCustom.getAuditContext(req);
    return await this.rolesService.create(dto, context);
  }

  @Get()
  @ApiOperation({ summary: 'Get all roles' })
  async findAll() {
    return await this.rolesService.findAll();
  }

  @Get(':roleId')
  @ApiOperation({ summary: 'Get role by id' })
  @ApiParam({ name: 'roleId', type: 'number', description: 'ID ของ Role (บทบาท)' })
  async findOne(@Param('roleId', ParseIntPipe) roleId: number) {
    return await this.rolesService.findOne(roleId);
  }

  @Put(':roleId')
  @ApiOperation({ summary: 'Update role details' })
  @ApiParam({ name: 'roleId', type: 'number', description: 'ID ของ Role (บทบาท)' })
  async update(
    @Param('roleId', ParseIntPipe) roleId: number,
    @Body() dto: UpdateRoleDto,
    @Req() req: any,
  ) {
    const context = FncCustom.getAuditContext(req);
    return await this.rolesService.update(roleId, dto, context);
  }

  @Delete(':roleId')
  @ApiOperation({ summary: 'Delete role' })
  @ApiParam({ name: 'roleId', type: 'number', description: 'ID ของ Role (บทบาท)' })
  async delete(@Param('roleId', ParseIntPipe) roleId: number, @Req() req: any) {
    const context = FncCustom.getAuditContext(req);
    return await this.rolesService.delete(roleId, context);
  }

  @Get(':roleId/permissions')
  @ApiOperation({ summary: 'Get permissions of a role' })
  @ApiParam({ name: 'roleId', type: 'number', description: 'ID ของ Role (บทบาท)' })
  async getPermissions(@Param('roleId', ParseIntPipe) roleId: number) {
    return await this.rolesService.getPermissions(roleId);
  }

  @Post(':roleId/permissions')
  @ApiOperation({ summary: 'Assign permissions to a role' })
  @ApiParam({ name: 'roleId', type: 'number', description: 'ID ของ Role (บทบาท)' })
  async assignPermissions(
    @Param('roleId', ParseIntPipe) roleId: number,
    @Body() dto: AssignPermissionsDto,
    @Req() req: any,
  ) {
    const context = FncCustom.getAuditContext(req);
    return await this.rolesService.assignPermissions(roleId, dto, context);
  }
}
