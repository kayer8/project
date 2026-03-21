import { Module } from '@nestjs/common';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { BuildingService } from './building.service';

@Module({
  imports: [AuditLogModule],
  providers: [BuildingService],
  exports: [BuildingService],
})
export class BuildingModule {}
