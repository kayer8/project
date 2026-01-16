import { Body, Controller, Get, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { User } from '../../common/decorators/user.decorator';
import { AuthUser } from '../auth/interfaces/auth-user.interface';
import { YearService } from './year.service';
import {
  CreatePlanDto,
  DirectionDetailQueryDto,
  MonthRecordsQueryDto,
  RecordDetailQueryDto,
  ReviewGenerateDto,
  ReviewPosterDto,
  UpdateDirectionsDto,
  YearQueryDto,
} from './dto/year.dto';

@ApiTags('year')
@ApiBearerAuth()
@Controller('year')
@UseGuards(JwtAuthGuard)
export class YearController {
  constructor(private readonly yearService: YearService) {}

  @Get('themes')
  getThemes() {
    return this.yearService.getThemes();
  }

  @Post('plan')
  createPlan(@User() user: AuthUser, @Body() dto: CreatePlanDto) {
    return this.yearService.createPlan(user.userId, dto.year, dto.theme_id);
  }

  @Get('plan')
  getPlan(@User() user: AuthUser, @Query() query: YearQueryDto) {
    return this.yearService.getPlan(user.userId, query.year);
  }

  @Put('directions')
  updateDirections(@User() user: AuthUser, @Body() dto: UpdateDirectionsDto) {
    return this.yearService.updateDirections(
      user.userId,
      dto.plan_id,
      dto.directions,
    );
  }

  @Get('summary')
  getSummary(@User() user: AuthUser, @Query() query: YearQueryDto) {
    return this.yearService.getSummary(user.userId, query.year);
  }

  @Get('direction_detail')
  getDirectionDetail(
    @User() user: AuthUser,
    @Query() query: DirectionDetailQueryDto,
  ) {
    return this.yearService.getDirectionDetail(
      user.userId,
      query.year,
      query.direction_id,
    );
  }

  @Get('month_records')
  getMonthRecords(
    @User() user: AuthUser,
    @Query() query: MonthRecordsQueryDto,
  ) {
    return this.yearService.getMonthRecords(
      user.userId,
      query.year,
      query.month,
    );
  }

  @Get('record_detail')
  getRecordDetail(
    @User() user: AuthUser,
    @Query() query: RecordDetailQueryDto,
  ) {
    return this.yearService.getRecordDetail(
      user.userId,
      query.type as 'daily_task' | 'night_session',
      query.id,
    );
  }

  @Post('review/generate')
  generateReview(@User() user: AuthUser, @Body() dto: ReviewGenerateDto) {
    return this.yearService.generateReview(user.userId, dto.year);
  }

  @Post('review/poster')
  generatePoster(@User() user: AuthUser, @Body() dto: ReviewPosterDto) {
    return this.yearService.generatePoster(user.userId, dto.review_id, dto.template);
  }
}
