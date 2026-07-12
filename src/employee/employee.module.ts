import { Module } from '@nestjs/common';
import { EmployeeController } from './employee.controller';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [UsersModule],
  controllers: [EmployeeController],
})
export class EmployeeModule {}
