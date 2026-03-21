import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AdminJwtAuthGuard } from '../../common/guards/admin-jwt-auth.guard';
import { AuditLogService } from '../audit-log/audit-log.service';
import { AdminAuditLogListQueryDto } from '../audit-log/dto/audit-log.dto';

@ApiTags('admin-operation-logs')
@ApiBearerAuth()
@Controller('admin/v1/operation-logs')
@UseGuards(AdminJwtAuthGuard)
export class AdminOperationLogsController {
  constructor(private readonly auditLogService: AuditLogService) {}

  @Get()
  list(@Query() query: AdminAuditLogListQueryDto) {
    return this.auditLogService.listAdmin(query);
  }
}
