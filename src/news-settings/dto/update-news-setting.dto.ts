import { PartialType } from '@nestjs/swagger';
import { CreateNewsSettingDto } from './create-news-setting.dto';

export class UpdateNewsSettingDto extends PartialType(CreateNewsSettingDto) {}
