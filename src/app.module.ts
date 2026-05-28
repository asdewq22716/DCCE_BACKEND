import { Module } from '@nestjs/common';
import { BannersModule } from './banners/banners.module';
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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
