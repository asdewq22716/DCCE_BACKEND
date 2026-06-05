import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards, Req, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ServerIpsService } from './server-ips.service';
import { CreateServerIpDto } from './dto/create-server-ip.dto';
import { UpdateServerIpDto } from './dto/update-server-ip.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@ApiTags('Server IPs (จัดการหมายเลข IP เซิร์ฟเวอร์)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('server-ips')
export class ServerIpsController {
  constructor(private readonly serverIpsService: ServerIpsService) {}

  @Get()
  @ApiOperation({ summary: 'ดึงรายการ Server IP ทั้งหมด' })
  findAll() {
    return this.serverIpsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'ดึงรายละเอียด Server IP 1 รายการ' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.serverIpsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'เพิ่มข้อมูล Server IP' })
  create(@Body() createDto: CreateServerIpDto, @Req() req: any) {
    const userId = req.user?.userId || 'anonymous';
    return this.serverIpsService.create(createDto, userId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'แก้ไขข้อมูล Server IP' })
  update(@Param('id', ParseIntPipe) id: number, @Body() updateDto: UpdateServerIpDto, @Req() req: any) {
    const userId = req.user?.userId || 'anonymous';
    return this.serverIpsService.update(id, updateDto, userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'ลบข้อมูล Server IP' })
  remove(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    const userId = req.user?.userId || 'anonymous';
    return this.serverIpsService.remove(id, userId);
  }
}
