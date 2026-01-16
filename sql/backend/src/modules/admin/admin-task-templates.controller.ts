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
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { Request } from 'express';
import { AdminTaskTemplatesService } from './admin-task-templates.service';
import { AdminJwtAuthGuard } from '../../common/guards/admin-jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { Admin } from '../../common/decorators/admin.decorator';
import { AdminAuthUser } from './interfaces/admin-auth-user.interface';

@ApiTags('admin-task-templates')
@ApiBearerAuth()
@Controller('admin/v1/task_templates')
@UseGuards(AdminJwtAuthGuard, PermissionsGuard)
export class AdminTaskTemplatesController {
  constructor(private readonly service: AdminTaskTemplatesService) {}

  @Get()
  @RequirePermissions('task_templates:read')
  list(@Query() query: TaskTemplateListQueryDto) {
    return this.service.list({
      q: query.q,
      isActive: query.is_active,
      type: query.type,
      difficulty: query.difficulty,
      moods: splitTags(query.moods),
      directionTags: splitTags(query.direction_tags),
      traceTags: splitTags(query.trace_tags),
      updatedFrom: query.updated_from ? new Date(query.updated_from) : undefined,
      updatedTo: query.updated_to ? new Date(query.updated_to) : undefined,
      sort: query.sort,
      page: query.page,
      pageSize: query.page_size,
    });
  }

  @Post()
  @RequirePermissions('task_templates:write')
  create(
    @Admin() admin: AdminAuthUser,
    @Body() body: TaskTemplateCreateDto,
    @Req() req: Request,
  ) {
    return this.service.create({
      title: body.title,
      description: body.description ?? '',
      type: body.type,
      difficulty: body.difficulty,
      defaultDurationSec: body.default_duration_sec ?? null,
      steps: body.steps ?? [],
      moods: body.moods ?? [],
      directionTags: body.direction_tags ?? [],
      traceTags: body.trace_tags ?? [],
      isActive: body.is_active ?? false,
      adminId: admin.adminId,
      ip: req.ip,
      userAgent: req.headers['user-agent'] ?? null,
    });
  }

  @Get(':id')
  @RequirePermissions('task_templates:read')
  getById(@Param('id') id: string) {
    return this.service.getById(id);
  }

  @Put(':id')
  @RequirePermissions('task_templates:write')
  update(
    @Admin() admin: AdminAuthUser,
    @Param('id') id: string,
    @Body() body: TaskTemplateUpdateDto,
    @Req() req: Request,
  ) {
    return this.service.update(id, {
      title: body.title,
      description: body.description ?? undefined,
      type: body.type,
      difficulty: body.difficulty,
      defaultDurationSec: body.default_duration_sec,
      steps: body.steps,
      moods: body.moods,
      directionTags: body.direction_tags,
      traceTags: body.trace_tags,
      adminId: admin.adminId,
      ip: req.ip,
      userAgent: req.headers['user-agent'] ?? null,
    });
  }

  @Post(':id/activate')
  @RequirePermissions('task_templates:write')
  activate(
    @Admin() admin: AdminAuthUser,
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    return this.service.setActive(id, true, {
      adminId: admin.adminId,
      ip: req.ip,
      userAgent: req.headers['user-agent'] ?? null,
    });
  }

  @Post(':id/deactivate')
  @RequirePermissions('task_templates:write')
  deactivate(
    @Admin() admin: AdminAuthUser,
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    return this.service.setActive(id, false, {
      adminId: admin.adminId,
      ip: req.ip,
      userAgent: req.headers['user-agent'] ?? null,
    });
  }

  @Post(':id/duplicate')
  @RequirePermissions('task_templates:write')
  duplicate(
    @Admin() admin: AdminAuthUser,
    @Param('id') id: string,
    @Body() body: TaskTemplateDuplicateDto,
    @Req() req: Request,
  ) {
    return this.service.duplicate(id, body.title_suffix, {
      adminId: admin.adminId,
      ip: req.ip,
      userAgent: req.headers['user-agent'] ?? null,
    });
  }

  @Delete(':id')
  @RequirePermissions('task_templates:write')
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

  @Post('import')
  @RequirePermissions('task_templates:write')
  previewImport(
    @Admin() admin: AdminAuthUser,
    @Body() body: TaskTemplateImportDto,
    @Req() req: Request,
  ) {
    return this.service.previewImport({
      format: body.format,
      fileUrl: body.file_url ?? null,
      defaultActive: body.default_active ?? false,
      adminId: admin.adminId,
      ip: req.ip,
      userAgent: req.headers['user-agent'] ?? null,
    });
  }

  @Post('import/:importId/commit')
  @RequirePermissions('task_templates:write')
  commitImport(
    @Admin() admin: AdminAuthUser,
    @Param('importId') importId: string,
    @Req() req: Request,
  ) {
    return this.service.commitImport({
      importId,
      adminId: admin.adminId,
      ip: req.ip,
      userAgent: req.headers['user-agent'] ?? null,
    });
  }
}

class TaskTemplateListQueryDto {
  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  difficulty?: number;

  @IsOptional()
  @IsString()
  moods?: string;

  @IsOptional()
  @IsString()
  direction_tags?: string;

  @IsOptional()
  @IsString()
  trace_tags?: string;

  @IsOptional()
  @IsString()
  updated_from?: string;

  @IsOptional()
  @IsString()
  updated_to?: string;

  @IsOptional()
  @IsString()
  sort?: string;

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

class TaskTemplateCreateDto {
  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsString()
  type!: string;

  @IsInt()
  @Min(1)
  difficulty!: number;

  @IsOptional()
  @IsInt()
  default_duration_sec?: number | null;

  @IsOptional()
  @IsArray()
  steps?: unknown[];

  @IsOptional()
  @IsArray()
  moods?: string[];

  @IsOptional()
  @IsArray()
  direction_tags?: string[];

  @IsOptional()
  @IsArray()
  trace_tags?: string[];

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

class TaskTemplateUpdateDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  difficulty?: number;

  @IsOptional()
  @IsInt()
  default_duration_sec?: number | null;

  @IsOptional()
  @IsArray()
  steps?: unknown[] | null;

  @IsOptional()
  @IsArray()
  moods?: string[] | null;

  @IsOptional()
  @IsArray()
  direction_tags?: string[] | null;

  @IsOptional()
  @IsArray()
  trace_tags?: string[] | null;
}

class TaskTemplateDuplicateDto {
  @IsOptional()
  @IsString()
  title_suffix?: string;
}

class TaskTemplateImportDto {
  @IsString()
  format!: string;

  @IsOptional()
  @IsString()
  file_url?: string;

  @IsOptional()
  @IsBoolean()
  default_active?: boolean;
}

function splitTags(value?: string) {
  if (!value) {
    return undefined;
  }
  const items = value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
  return items.length ? items : undefined;
}
