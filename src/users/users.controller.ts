import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { UsersService } from './users.service';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@Controller('users')
@ApiTags('Users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @UseGuards(JwtAuthGuard)
  @Get(':id') // รับ id จาก URL
  @ApiOperation({ summary: 'Get user by id' })
  @ApiParam({ name: 'id', example: 1, description: 'ID ของผู้ใช้งาน' })
  getUserById(@Param('id') id: number) {
    return this.usersService.getUserById(id);
  }
}
