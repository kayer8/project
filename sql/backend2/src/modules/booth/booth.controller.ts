import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { BoothService } from './booth.service';
import { BoothMapQueryDto } from './dto/map-query.dto';
import { BoothListQueryDto } from './dto/list-query.dto';

@ApiTags('Booths')
@Controller('api/booths')
export class BoothController {
  constructor(private readonly boothService: BoothService) {}

  @Get('map')
  getMapBooths(@Query() query: BoothMapQueryDto) {
    return this.boothService.getMapBooths(query);
  }

  @Get()
  list(@Query() query: BoothListQueryDto) {
    return this.boothService.listBooths(query);
  }

  @Get(':id')
  detail(@Param('id', ParseIntPipe) id: number) {
    return this.boothService.getBoothDetail(id);
  }
}
