import { PartialType } from '@nestjs/mapped-types';
import { CreateSystemServiceDto } from './create-system-service.dto';

export class UpdateSystemServiceDto extends PartialType(CreateSystemServiceDto) {}
