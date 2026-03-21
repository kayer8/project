import { Module } from '@nestjs/common';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { HouseController } from './house.controller';
import { HouseService } from './house.service';

@Module({
  imports: [AuditLogModule],
  controllers: [HouseController],
  providers: [HouseService],
  exports: [HouseService],
})
export class HouseModule {}
