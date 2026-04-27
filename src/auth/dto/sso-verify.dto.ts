import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class SsoVerifyDto {
  @ApiProperty({ description: 'SSO Token to verify' })
  @IsNotEmpty()
  @IsString()
  token: string;
}
