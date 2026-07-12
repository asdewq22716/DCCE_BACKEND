import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class SsoLoginDto {
  @ApiProperty({
    example: 'eform01',
    description: 'Username for SSO authentication',
  })
  @IsNotEmpty()
  @IsString()
  user: string;

  @ApiProperty({
    example: 'Form01@26',
    description: 'Password for SSO authentication',
  })
  @IsNotEmpty()
  @IsString()
  pass: string;
}
