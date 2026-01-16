import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { User } from '../../common/decorators/user.decorator';
import { AuthUser } from '../auth/interfaces/auth-user.interface';
import { NightService } from './night.service';
import { NightFinishDto, NightStartDto } from './dto/night.dto';

@ApiTags('night')
@ApiBearerAuth()
@Controller('night')
@UseGuards(JwtAuthGuard)
export class NightController {
  constructor(private readonly nightService: NightService) {}

  @Get('programs')
  getPrograms() {
    return this.nightService.getPrograms();
  }

  @Post('start')
  start(@User() user: AuthUser, @Body() dto: NightStartDto) {
    return this.nightService.startSession(user.userId, dto.date, dto.program_id);
  }

  @Post('finish')
  finish(@User() user: AuthUser, @Body() dto: NightFinishDto) {
    return this.nightService.finishSession(
      user.userId,
      dto.night_session_id,
      dto.answers,
      dto.finished_at,
    );
  }
}
