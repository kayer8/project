import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { AdminDashboardService } from './admin-dashboard.service';
import { AdminJwtAuthGuard } from '../../common/guards/admin-jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@ApiTags('admin-dashboard')
@ApiBearerAuth()
@Controller('admin/v1/dashboard')
@UseGuards(AdminJwtAuthGuard, PermissionsGuard)
export class AdminDashboardController {
  constructor(private readonly service: AdminDashboardService) {}

  @Get('overview')
  @RequirePermissions('dashboard:read')
  overview(@Query() query: DateRangeQueryDto) {
    return this.service.overview(query.date_from, query.date_to);
  }

  @Get('funnel/today_tasks')
  @RequirePermissions('dashboard:read')
  funnelTodayTasks(@Query() query: DateRangeQueryDto) {
    return this.service.funnelTodayTasks(query.date_from, query.date_to);
  }

  @Get('funnel/night')
  @RequirePermissions('dashboard:read')
  funnelNight(@Query() query: DateRangeQueryDto) {
    return this.service.funnelNight(query.date_from, query.date_to);
  }

  @Get('ranking/task_templates')
  @RequirePermissions('dashboard:read')
  ranking(@Query() query: TaskTemplateRankingQueryDto) {
    return this.service.rankingTaskTemplates(query.window, query.metric);
  }
}

class DateRangeQueryDto {
  @IsOptional()
  @IsString()
  date_from?: string;

  @IsOptional()
  @IsString()
  date_to?: string;
}

class TaskTemplateRankingQueryDto {
  @IsOptional()
  @IsString()
  window?: string;

  @IsOptional()
  @IsString()
  metric?: string;
}
