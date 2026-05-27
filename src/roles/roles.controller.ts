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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiBody } from '@nestjs/swagger';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { AssignPermissionsDto } from './dto/assign-permissions.dto';
import { FncCustom } from 'src/common/fnc-custom';

@ApiTags('Roles')
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

  @Get(':id')
  @ApiOperation({ summary: 'Get role by id' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.rolesService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update role details' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateRoleDto,
    @Req() req: any,
  ) {
    const context = FncCustom.getAuditContext(req);
    return await this.rolesService.update(id, dto, context);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete role' })
  async delete(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    const context = FncCustom.getAuditContext(req);
    return await this.rolesService.delete(id, context);
  }

  @Get(':id/permissions')
  @ApiOperation({ summary: 'Get permissions of a role' })
  async getPermissions(@Param('id', ParseIntPipe) id: number) {
    return await this.rolesService.getPermissions(id);
  }

  @Post(':id/permissions')
  @ApiOperation({ summary: 'Assign permissions to a role' })
  async assignPermissions(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AssignPermissionsDto,
    @Req() req: any,
  ) {
    const context = FncCustom.getAuditContext(req);
    return await this.rolesService.assignPermissions(id, dto, context);
  }
}
