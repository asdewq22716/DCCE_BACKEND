import { Controller, Post, Body } from '@nestjs/common';
import { TableauService } from './tableau.service';
import { GetTableauTicketDto } from './dto/get-tableau-ticket.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Tableau')
@Controller('tableau')
export class TableauController {
  constructor(private readonly tableauService: TableauService) {}

  @Post('trusted-url')
  @ApiOperation({ summary: 'Get Tableau Trusted Authentication URL' })
  @ApiResponse({
    status: 201,
    description: 'URL generated successfully',
    schema: {
      example: {
        success: true,
        url: 'http://192.168.65.59/trusted/abc12345/views/_V2/sheet0',
      },
    },
  })
  async getTrustedUrl(@Body() dto: GetTableauTicketDto) {
    return await this.tableauService.getTrustedUrl(dto);
  }
}
