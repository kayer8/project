import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsDateString, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { AdminAuditService } from './admin-audit.service';
import { AdminJwtAuthGuard } from '../../common/guards/admin-jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@ApiTags('admin-audit')
@ApiBearerAuth()
@Controller('admin/v1/audit_logs')
@UseGuards(AdminJwtAuthGuard, PermissionsGuard)
export class AdminAuditController {
  constructor(private readonly auditService: AdminAuditService) {}

  @Get()
  @RequirePermissions('audit_logs:read')
  list(@Query() query: AdminAuditQueryDto) {
    return this.auditService.listLogs({
      resourceType: query.resource_type,
      resourceId: query.resource_id,
      actorAdminId: query.actor_admin_id,
      dateFrom: query.date_from ? new Date(query.date_from) : undefined,
      dateTo: query.date_to ? new Date(query.date_to) : undefined,
      page: query.page,
      pageSize: query.page_size,
    });
  }
}

class AdminAuditQueryDto {
  @IsOptional()
  @IsString()
  resource_type?: string;

  @IsOptional()
  @IsString()
  resource_id?: string;

  @IsOptional()
  @IsString()
  actor_admin_id?: string;

  @IsOptional()
  @IsDateString()
  date_from?: string;

  @IsOptional()
  @IsDateString()
  date_to?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(200)
  page_size = 20;
}
