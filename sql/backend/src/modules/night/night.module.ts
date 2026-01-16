import { Module } from '@nestjs/common';
import { NightController } from './night.controller';
import { NightService } from './night.service';

@Module({
  controllers: [NightController],
  providers: [NightService],
})
export class NightModule {}
