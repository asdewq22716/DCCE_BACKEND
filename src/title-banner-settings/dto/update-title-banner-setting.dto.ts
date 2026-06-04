import { PartialType } from '@nestjs/swagger';
import { CreateTitleBannerSettingDto } from './create-title-banner-setting.dto';

export class UpdateTitleBannerSettingDto extends PartialType(CreateTitleBannerSettingDto) {}
