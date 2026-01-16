import { Body, Controller, Get, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsInt, IsObject, IsOptional, IsString } from 'class-validator';
import { Request } from 'express';
import { AdminConfigsService } from './admin-configs.service';
import { AdminJwtAuthGuard } from '../../common/guards/admin-jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { Admin } from '../../common/decorators/admin.decorator';
import { AdminAuthUser } from './interfaces/admin-auth-user.interface';

@ApiTags('admin-configs')
@ApiBearerAuth()
@Controller('admin/v1/configs')
@UseGuards(AdminJwtAuthGuard, PermissionsGuard)
export class AdminConfigsController {
  constructor(private readonly service: AdminConfigsService) {}

  @Get()
  @RequirePermissions('configs:read')
  getConfig(@Query() query: ConfigQueryDto) {
    return this.service.getConfig(query.key);
  }

  @Put('draft')
  @RequirePermissions('configs:write')
  saveDraft(
    @Admin() admin: AdminAuthUser,
    @Query() query: ConfigQueryDto,
    @Body() body: ConfigDraftDto,
    @Req() req: Request,
  ) {
    return this.service.saveDraft({
      key: query.key,
      value: body.value,
      adminId: admin.adminId,
      ip: req.ip,
      userAgent: req.headers['user-agent'] ?? null,
    });
  }

  @Post('publish')
  @RequirePermissions('configs:write')
  publish(
    @Admin() admin: AdminAuthUser,
    @Query() query: ConfigQueryDto,
    @Body() body: ConfigPublishDto,
    @Req() req: Request,
  ) {
    return this.service.publish({
      key: query.key,
      draftId: body.draft_id,
      comment: body.comment,
      adminId: admin.adminId,
      ip: req.ip,
      userAgent: req.headers['user-agent'] ?? null,
    });
  }

  @Post('rollback')
  @RequirePermissions('configs:write')
  rollback(
    @Admin() admin: AdminAuthUser,
    @Query() query: ConfigQueryDto,
    @Body() body: ConfigRollbackDto,
    @Req() req: Request,
  ) {
    return this.service.rollback({
      key: query.key,
      toVersion: body.to_version,
      comment: body.comment,
      adminId: admin.adminId,
      ip: req.ip,
      userAgent: req.headers['user-agent'] ?? null,
    });
  }

  @Get('history')
  @RequirePermissions('configs:read')
  history(@Query() query: ConfigQueryDto) {
    return this.service.history(query.key);
  }
}

class ConfigQueryDto {
  @IsString()
  key!: string;
}

class ConfigDraftDto {
  @IsObject()
  value!: Record<string, unknown>;
}

class ConfigPublishDto {
  @IsString()
  draft_id!: string;

  @IsOptional()
  @IsString()
  comment?: string;
}

class ConfigRollbackDto {
  @IsInt()
  to_version!: number;

  @IsOptional()
  @IsString()
  comment?: string;
}
