import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { CommonModule } from './common/common.module';
import { UsersModule } from './users/users.module';
import { PermissionsModule } from './permissions/permissions.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { AuditLogsModule } from './audit-logs/audit-logs.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    CommonModule,
    AuthModule,
    UsersModule,
    PermissionsModule,
    OrganizationsModule,
    AuditLogsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
