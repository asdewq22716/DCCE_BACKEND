import { Module } from '@nestjs/common';
import { TitleBannerSettingsModule } from './title-banner-settings/title-banner-settings.module';
import { ApiObjectivesModule } from './api-requests/api-objectives/api-objectives.module';
import { ServerIpsModule } from './api-requests/server-ips/server-ips.module';
import { ApiRequestsModule } from './api-requests/api-requests.module';
import { TableauModule } from './tableau/tableau.module';
import { BannersModule } from './banners/banners.module';
import { AboutUsModule } from './about-us/about-us.module';
import { NewsSettingsModule } from './news-settings/news-settings.module';
import { TagsModule } from './tags/tags.module';
import { ManualModule } from './manual/manual.module';
import { FaqSettingModule } from './faq-setting/faq-setting.module';
import { ApprovalsModule } from './approvals/approvals.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { CommonModule } from './common/common.module';
import { UsersModule } from './users/users.module';
import { PermissionsModule } from './permissions/permissions.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { AuditLogsModule } from './audit-logs/audit-logs.module';
import { RolesModule } from './roles/roles.module';
import { ScheduleModule } from '@nestjs/schedule';
import { UploadsModule } from './uploads/uploads.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { MaintenanceModule } from './maintenance/maintenance.module';
import { SystemServicesModule } from './system-services/system-services.module';
import { EFormModule } from './e-form/e-form.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'public'),
      serveRoot: '/',
    }),
    CommonModule,
    AuthModule,
    UsersModule,
    PermissionsModule,
    OrganizationsModule,
    AuditLogsModule,
    RolesModule,
    ScheduleModule.forRoot(),
    UploadsModule,
    BannersModule,
    AboutUsModule,
    NewsSettingsModule,
    TagsModule,
    ManualModule,
    FaqSettingModule,
    TableauModule,
    TitleBannerSettingsModule,
    ApiObjectivesModule,
    ServerIpsModule,
    ApiRequestsModule,
    MaintenanceModule,
    SystemServicesModule,
    EFormModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
