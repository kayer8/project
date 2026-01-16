import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { Request } from 'express';
import { AdminCopyTemplatesService } from './admin-copy-templates.service';
import { AdminJwtAuthGuard } from '../../common/guards/admin-jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { Admin } from '../../common/decorators/admin.decorator';
import { AdminAuthUser } from './interfaces/admin-auth-user.interface';

@ApiTags('admin-copy-templates')
@ApiBearerAuth()
@Controller('admin/v1/copy_templates')
@UseGuards(AdminJwtAuthGuard, PermissionsGuard)
export class AdminCopyTemplatesController {
  constructor(private readonly service: AdminCopyTemplatesService) {}

  @Get()
  @RequirePermissions('copy_templates:read')
  list(@Query() query: CopyTemplateListQueryDto) {
    return this.service.list({
      type: query.type,
      isEnabled: query.is_enabled,
      traceTag: query.trace_tag,
      mood: query.mood,
      directionId: query.direction_id,
      q: query.q,
      page: query.page,
      pageSize: query.page_size,
    });
  }

  @Post()
  @RequirePermissions('copy_templates:write')
  create(
    @Admin() admin: AdminAuthUser,
    @Body() body: CopyTemplateCreateDto,
    @Req() req: Request,
  ) {
    return this.service.create({
      type: body.type,
      text: body.text,
      conditions: body.conditions ?? {},
      weight: body.weight ?? 1,
      isEnabled: body.is_enabled ?? true,
      adminId: admin.adminId,
      ip: req.ip,
      userAgent: req.headers['user-agent'] ?? null,
    });
  }

  @Put(':id')
  @RequirePermissions('copy_templates:write')
  update(
    @Admin() admin: AdminAuthUser,
    @Param('id') id: string,
    @Body() body: CopyTemplateUpdateDto,
    @Req() req: Request,
  ) {
    return this.service.update(id, {
      type: body.type,
      text: body.text,
      conditions: body.conditions,
      weight: body.weight,
      isEnabled: body.is_enabled,
      adminId: admin.adminId,
      ip: req.ip,
      userAgent: req.headers['user-agent'] ?? null,
    });
  }

  @Post(':id/enable')
  @RequirePermissions('copy_templates:write')
  enable(
    @Admin() admin: AdminAuthUser,
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    return this.service.setEnabled(id, true, {
      adminId: admin.adminId,
      ip: req.ip,
      userAgent: req.headers['user-agent'] ?? null,
    });
  }

  @Post(':id/disable')
  @RequirePermissions('copy_templates:write')
  disable(
    @Admin() admin: AdminAuthUser,
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    return this.service.setEnabled(id, false, {
      adminId: admin.adminId,
      ip: req.ip,
      userAgent: req.headers['user-agent'] ?? null,
    });
  }

  @Delete(':id')
  @RequirePermissions('copy_templates:write')
  remove(
    @Admin() admin: AdminAuthUser,
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    return this.service.remove(id, {
      adminId: admin.adminId,
      ip: req.ip,
      userAgent: req.headers['user-agent'] ?? null,
    });
  }
}

class CopyTemplateListQueryDto {
  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsBoolean()
  is_enabled?: boolean;

  @IsOptional()
  @IsString()
  trace_tag?: string;

  @IsOptional()
  @IsString()
  mood?: string;

  @IsOptional()
  @IsString()
  direction_id?: string;

  @IsOptional()
  @IsString()
  q?: string;

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

class CopyTemplateCreateDto {
  @IsString()
  type!: string;

  @IsString()
  text!: string;

  @IsOptional()
  @IsObject()
  conditions?: Record<string, unknown>;

  @IsOptional()
  @IsInt()
  weight?: number;

  @IsOptional()
  @IsBoolean()
  is_enabled?: boolean;
}

class CopyTemplateUpdateDto {
  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  text?: string;

  @IsOptional()
  @IsObject()
  conditions?: Record<string, unknown> | null;

  @IsOptional()
  @IsInt()
  weight?: number;

  @IsOptional()
  @IsBoolean()
  is_enabled?: boolean;
}
