import { Module } from '@nestjs/common';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { DisclosureController } from './disclosure.controller';
import { DisclosureService } from './disclosure.service';

@Module({
  imports: [AuditLogModule],
  controllers: [DisclosureController],
  providers: [DisclosureService],
  exports: [DisclosureService],
})
export class DisclosureModule {}
