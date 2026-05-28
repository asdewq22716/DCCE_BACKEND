import { Controller, Post, UseInterceptors, UploadedFiles, Req, BadRequestException, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FilesInterceptor } from '@nestjs/platform-express';
import { tempStorageOptions } from '../common/utils/file-upload.util';
import { UploadsService } from './uploads.service';

@ApiTags('Uploads')
@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  // API เส้นเดียวที่รองรับการอัปโหลดทั้งแบบ 1 ไฟล์ หรือ หลายไฟล์ (สูงสุด 10 ไฟล์)
  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth() // ต้องล็อกอินก่อน
  @ApiOperation({ summary: 'อัปโหลดไฟล์ชั่วคราว (รองรับทีละหลายไฟล์)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
          description: 'เลือกไฟล์ที่ต้องการอัปโหลด (เลือกได้หลายไฟล์)',
        },
      },
    },
  })
  @UseInterceptors(FilesInterceptor('files', 10, tempStorageOptions)) // ใช้คีย์คำว่า 'files'
  async uploadTempFiles(@UploadedFiles() files: Array<Express.Multer.File>, @Req() req: any) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files provided');
    }

    const userId = req.user?.userId ? req.user.userId.toString() : 'anonymous';
    
    const results = [];
    for (const file of files) {
      const result = await this.uploadsService.saveTempFile(file, userId);
      results.push(result);
    }
    
    // คืนค่ากลับไปเป็น Array ของข้อมูลไฟล์เสมอ แม้จะอัปแค่ 1 ไฟล์ก็ตาม
    return results;
  }
}
