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
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { AssignPermissionsDto } from './dto/assign-permissions.dto';
import { FncCustom } from 'src/common/fnc-custom';

@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post()
  async create(@Body() dto: CreateRoleDto, @Req() req: any) {
    const context = FncCustom.getAuditContext(req);
    return await this.rolesService.create(dto, context);
  }

  @Get()
  async findAll() {
    return await this.rolesService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.rolesService.findOne(id);
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateRoleDto,
    @Req() req: any,
  ) {
    const context = FncCustom.getAuditContext(req);
    return await this.rolesService.update(id, dto, context);
  }

  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    const context = FncCustom.getAuditContext(req);
    return await this.rolesService.delete(id, context);
  }

  @Get(':id/permissions')
  async getPermissions(@Param('id', ParseIntPipe) id: number) {
    return await this.rolesService.getPermissions(id);
  }

  @Post(':id/permissions')
  async assignPermissions(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AssignPermissionsDto,
    @Req() req: any,
  ) {
    const context = FncCustom.getAuditContext(req);
    return await this.rolesService.assignPermissions(id, dto, context);
  }
}
