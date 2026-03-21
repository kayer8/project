import { Module } from '@nestjs/common';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { ManagementFeeController } from './management-fee.controller';
import { ManagementFeeService } from './management-fee.service';

@Module({
  imports: [AuditLogModule],
  controllers: [ManagementFeeController],
  providers: [ManagementFeeService],
  exports: [ManagementFeeService],
})
export class ManagementFeeModule {}
