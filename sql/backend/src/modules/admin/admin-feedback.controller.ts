import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  IsInt,
  Max,
  Min,
} from 'class-validator';
import { Request } from 'express';
import { AdminFeedbackService } from './admin-feedback.service';
import { AdminJwtAuthGuard } from '../../common/guards/admin-jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { Admin } from '../../common/decorators/admin.decorator';
import { AdminAuthUser } from './interfaces/admin-auth-user.interface';

@ApiTags('admin-feedback')
@ApiBearerAuth()
@Controller('admin/v1/feedback_tickets')
@UseGuards(AdminJwtAuthGuard, PermissionsGuard)
export class AdminFeedbackController {
  constructor(private readonly service: AdminFeedbackService) {}

  @Get()
  @RequirePermissions('feedback:read')
  list(@Query() query: FeedbackListQueryDto) {
    return this.service.list({
      status: query.status,
      type: query.type,
      assigneeAdminId: query.assignee_admin_id,
      q: query.q,
      dateFrom: query.date_from ? new Date(query.date_from) : undefined,
      dateTo: query.date_to ? new Date(query.date_to) : undefined,
      tag: query.tag,
      page: query.page,
      pageSize: query.page_size,
    });
  }

  @Get(':id')
  @RequirePermissions('feedback:read')
  getById(@Param('id') id: string) {
    return this.service.getById(id);
  }

  @Post(':id/assign')
  @RequirePermissions('feedback:write')
  assign(
    @Admin() admin: AdminAuthUser,
    @Param('id') id: string,
    @Body() body: FeedbackAssignDto,
    @Req() req: Request,
  ) {
    return this.service.assign(id, body.assignee_admin_id, {
      adminId: admin.adminId,
      ip: req.ip,
      userAgent: req.headers['user-agent'] ?? null,
    });
  }

  @Post(':id/status')
  @RequirePermissions('feedback:write')
  updateStatus(
    @Admin() admin: AdminAuthUser,
    @Param('id') id: string,
    @Body() body: FeedbackStatusDto,
    @Req() req: Request,
  ) {
    return this.service.updateStatus(id, body.status, body.note, {
      adminId: admin.adminId,
      ip: req.ip,
      userAgent: req.headers['user-agent'] ?? null,
    });
  }

  @Post(':id/tags')
  @RequirePermissions('feedback:write')
  updateTags(
    @Admin() admin: AdminAuthUser,
    @Param('id') id: string,
    @Body() body: FeedbackTagsDto,
    @Req() req: Request,
  ) {
    return this.service.updateTags(id, body.tags, {
      adminId: admin.adminId,
      ip: req.ip,
      userAgent: req.headers['user-agent'] ?? null,
    });
  }

  @Post(':id/comment')
  @RequirePermissions('feedback:write')
  addComment(
    @Admin() admin: AdminAuthUser,
    @Param('id') id: string,
    @Body() body: FeedbackCommentDto,
    @Req() req: Request,
  ) {
    return this.service.addComment(id, body.text, body.is_internal ?? true, {
      adminId: admin.adminId,
      ip: req.ip,
      userAgent: req.headers['user-agent'] ?? null,
    });
  }
}

class FeedbackListQueryDto {
  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  assignee_admin_id?: string;

  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsString()
  date_from?: string;

  @IsOptional()
  @IsString()
  date_to?: string;

  @IsOptional()
  @IsString()
  tag?: string;

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

class FeedbackAssignDto {
  @IsString()
  assignee_admin_id!: string;
}

class FeedbackStatusDto {
  @IsString()
  status!: string;

  @IsOptional()
  @IsString()
  note?: string;
}

class FeedbackTagsDto {
  @IsArray()
  tags!: string[];
}

class FeedbackCommentDto {
  @IsString()
  text!: string;

  @IsOptional()
  @IsBoolean()
  is_internal?: boolean;
}
