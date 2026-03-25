import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ManagementFeeService } from './management-fee.service';
import { ManagementFeePeriodQueryDto } from './dto/management-fee.dto';

@ApiTags('management-fees')
@Controller('management-fees')
export class ManagementFeeController {
  constructor(private readonly managementFeeService: ManagementFeeService) {}

  @Get('disclosure')
  disclosure(@Query() query: ManagementFeePeriodQueryDto) {
    return this.managementFeeService.getDisclosure(query);
  }

  @Get('disclosure-tree')
  disclosureTree(@Query() query: ManagementFeePeriodQueryDto) {
    return this.managementFeeService.getDisclosureTree(query);
  }
}
