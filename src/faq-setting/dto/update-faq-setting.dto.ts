import { PartialType } from '@nestjs/swagger';
import { CreateFaqSettingDto } from './create-faq-setting.dto';

export class UpdateFaqSettingDto extends PartialType(CreateFaqSettingDto) {}
