import { PartialType } from '@nestjs/swagger';
import { CreateServerIpDto } from './create-server-ip.dto';

export class UpdateServerIpDto extends PartialType(CreateServerIpDto) {}
