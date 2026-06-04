import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GetTableauTicketDto {
  @ApiProperty({
    description: 'Path of the dashboard to access',
    example: '/views/_V2/sheet0',
  })
  @IsString()
  @IsNotEmpty()
  dashboardPath: string;
}
