import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class SsoLoginDto {
  @ApiProperty({ example: 'eform01', description: 'Username for SSO authentication' })
  @IsNotEmpty()
  @IsString()
  user: string;

  @ApiProperty({ example: '57FB023138E362AEB8F080B8ABA78F68B9B41B33', description: 'Password for SSO authentication' })
  @IsNotEmpty()
  @IsString()
  pass: string;
}
