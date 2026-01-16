import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { User } from '../../common/decorators/user.decorator';
import { AuthUser } from '../auth/interfaces/auth-user.interface';
import { TodayService } from './today.service';
import { RefreshTodayDto, TodayQueryDto } from './dto/today.dto';

@ApiTags('today')
@ApiBearerAuth()
@Controller('today')
@UseGuards(JwtAuthGuard)
export class TodayController {
  constructor(private readonly todayService: TodayService) {}

  @Get()
  getToday(@User() user: AuthUser, @Query() query: TodayQueryDto) {
    return this.todayService.getToday(user.userId, query.date);
  }

  @Post('refresh')
  refresh(@User() user: AuthUser, @Body() dto: RefreshTodayDto) {
    return this.todayService.refreshTask(
      user.userId,
      dto.date,
      dto.mood,
      dto.replace_position,
      dto.reason,
    );
  }
}
