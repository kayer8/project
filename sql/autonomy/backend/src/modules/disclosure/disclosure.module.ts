import { Module } from '@nestjs/common';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { DisclosureService } from './disclosure.service';

@Module({
  imports: [AuditLogModule],
  providers: [DisclosureService],
  exports: [DisclosureService],
})
export class DisclosureModule {}
