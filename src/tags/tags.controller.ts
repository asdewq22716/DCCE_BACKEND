import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TagsService } from './tags.service';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Master Tags (จัดการแท็กข่าวสาร/กิจกรรม)')
@Controller('tags')
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  @Get()
  @ApiOperation({ summary: 'ดึงรายชื่อแท็กทั้งหมด (สำหรับ Dropdown)' })
  findAll() {
    return this.tagsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'ดึงรายละเอียดแท็กด้วย ID' })
  findOne(@Param('id') id: string) {
    return this.tagsService.findOne(+id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'สร้างแท็กใหม่' })
  create(@Body() createDto: CreateTagDto, @Req() req: any) {
    const userId = req.user?.userId ? req.user.userId.toString() : 'anonymous';
    return this.tagsService.create(createDto, userId);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'แก้ไขแท็ก' })
  update(@Param('id') id: string, @Body() updateDto: UpdateTagDto, @Req() req: any) {
    const userId = req.user?.userId ? req.user.userId.toString() : 'anonymous';
    return this.tagsService.update(+id, updateDto, userId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'ลบแท็ก' })
  remove(@Param('id') id: string, @Req() req: any) {
    const userId = req.user?.userId ? req.user.userId.toString() : 'anonymous';
    return this.tagsService.remove(+id, userId);
  }
}
