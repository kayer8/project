import { Module } from '@nestjs/common';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { VoteService } from './vote.service';

@Module({
  imports: [AuditLogModule],
  providers: [VoteService],
  exports: [VoteService],
})
export class VoteModule {}
