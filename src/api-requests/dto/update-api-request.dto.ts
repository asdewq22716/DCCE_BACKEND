import { PartialType, ApiPropertyOptional } from '@nestjs/swagger';
import { CreateApiRequestDto } from './create-api-request.dto';
import { IsString, IsIn, IsOptional } from 'class-validator';

export class UpdateApiRequestDto extends PartialType(CreateApiRequestDto) {}

export class UpdateApiRequestStatusDto {
  @ApiPropertyOptional({ description: 'สถานะ (pending, approved, rejected)' })
  @IsString()
  @IsIn(['pending', 'approved', 'rejected'])
  @IsOptional()
  status?: string;
}
