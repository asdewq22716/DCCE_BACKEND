import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { ApiOperation, ApiParam, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { AssignUserRolesDto } from './dto/assign-user-roles.dto';
import { FncCustom } from 'src/common/fnc-custom';

@Controller('users')
@ApiTags('Users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Get(':id') // รับ id จาก URL
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user by id' })
  @ApiParam({ name: 'id', example: 1, description: 'ID ของผู้ใช้งาน' })
  getUserById(@Param('id') id: number) {
    return this.usersService.getUserById(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/roles')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Assign global roles to user' })
  @ApiParam({ name: 'id', example: 1, description: 'ID ของผู้ใช้งาน' })
  assignUserRoles(
    @Param('id') id: number,
    @Body() dto: AssignUserRolesDto,
    @Req() req: any,
  ) {
    const context = FncCustom.getAuditContext(req);
    return this.usersService.assignUserRoles(id, dto, context);
  }
}
