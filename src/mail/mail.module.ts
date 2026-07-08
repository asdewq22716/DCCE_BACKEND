import { Module } from '@nestjs/common';
import { MailController } from './mail.controller';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [UsersModule],
  controllers: [MailController],
})
export class MailModule {}
