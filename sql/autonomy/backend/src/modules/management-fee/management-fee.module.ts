import { Module } from '@nestjs/common';
import { ManagementFeeController } from './management-fee.controller';
import { ManagementFeeService } from './management-fee.service';

@Module({
  controllers: [ManagementFeeController],
  providers: [ManagementFeeService],
  exports: [ManagementFeeService],
})
export class ManagementFeeModule {}
