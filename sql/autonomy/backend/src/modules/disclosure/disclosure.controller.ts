import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { DisclosureService } from './disclosure.service';
import { PublicDisclosureContentListQueryDto } from './dto/disclosure-content.dto';

@ApiTags('disclosure-contents')
@Controller('disclosure-contents')
export class DisclosureController {
  constructor(private readonly disclosureService: DisclosureService) {}

  @Get()
  list(@Query() query: PublicDisclosureContentListQueryDto) {
    return this.disclosureService.listPublic(query);
  }

  @Get(':id')
  detail(@Param('id') id: string) {
    return this.disclosureService.getPublicDetail(id);
  }
}
