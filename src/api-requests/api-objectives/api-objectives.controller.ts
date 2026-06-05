import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards, Req, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ApiObjectivesService } from './api-objectives.service';
import { CreateApiObjectiveDto } from './dto/create-api-objective.dto';
import { UpdateApiObjectiveDto } from './dto/update-api-objective.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@ApiTags('API Objectives (วัตถุประสงค์การใช้งาน API)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api-objectives')
export class ApiObjectivesController {
  constructor(private readonly apiObjectivesService: ApiObjectivesService) {}

  @Get()
  @ApiOperation({ summary: 'ดึงรายการวัตถุประสงค์การใช้งาน API ทั้งหมด' })
  findAll() {
    return this.apiObjectivesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'ดึงรายละเอียดวัตถุประสงค์ 1 รายการ' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.apiObjectivesService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'เพิ่มวัตถุประสงค์การใช้งาน API' })
  create(@Body() createDto: CreateApiObjectiveDto, @Req() req: any) {
    const userId = req.user?.userId || 'anonymous';
    return this.apiObjectivesService.create(createDto, userId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'แก้ไขวัตถุประสงค์การใช้งาน API' })
  update(@Param('id', ParseIntPipe) id: number, @Body() updateDto: UpdateApiObjectiveDto, @Req() req: any) {
    const userId = req.user?.userId || 'anonymous';
    return this.apiObjectivesService.update(id, updateDto, userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'ลบวัตถุประสงค์การใช้งาน API' })
  remove(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    const userId = req.user?.userId || 'anonymous';
    return this.apiObjectivesService.remove(id, userId);
  }
}
