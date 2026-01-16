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
  IsObject,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { Request } from 'express';
import { AdminNightProgramsService } from './admin-night-programs.service';
import { AdminJwtAuthGuard } from '../../common/guards/admin-jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { Admin } from '../../common/decorators/admin.decorator';
import { AdminAuthUser } from './interfaces/admin-auth-user.interface';

@ApiTags('admin-night-programs')
@ApiBearerAuth()
@Controller('admin/v1/night_programs')
@UseGuards(AdminJwtAuthGuard, PermissionsGuard)
export class AdminNightProgramsController {
  constructor(private readonly service: AdminNightProgramsService) {}

  @Get()
  @RequirePermissions('night_programs:read')
  list(@Query() query: NightProgramListQueryDto) {
    return this.service.list({
      q: query.q,
      type: query.type,
      isActive: query.is_active,
      sort: query.sort,
      page: query.page,
      pageSize: query.page_size,
    });
  }

  @Post()
  @RequirePermissions('night_programs:write')
  create(
    @Admin() admin: AdminAuthUser,
    @Body() body: NightProgramCreateDto,
    @Req() req: Request,
  ) {
    return this.service.create({
      title: body.title,
      type: body.type,
      durationSec: body.duration_sec ?? null,
      content: body.content ?? {},
      moods: body.moods ?? [],
      directionTags: body.direction_tags ?? [],
      isActive: body.is_active ?? false,
      adminId: admin.adminId,
      ip: req.ip,
      userAgent: req.headers['user-agent'] ?? null,
    });
  }

  @Get(':id')
  @RequirePermissions('night_programs:read')
  getById(@Param('id') id: string) {
    return this.service.getById(id);
  }

  @Put(':id')
  @RequirePermissions('night_programs:write')
  update(
    @Admin() admin: AdminAuthUser,
    @Param('id') id: string,
    @Body() body: NightProgramUpdateDto,
    @Req() req: Request,
  ) {
    return this.service.update(id, {
      title: body.title,
      type: body.type,
      durationSec: body.duration_sec,
      content: body.content,
      moods: body.moods,
      directionTags: body.direction_tags,
      isActive: body.is_active,
      adminId: admin.adminId,
      ip: req.ip,
      userAgent: req.headers['user-agent'] ?? null,
    });
  }

  @Post(':id/activate')
  @RequirePermissions('night_programs:write')
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
  @RequirePermissions('night_programs:write')
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
  @RequirePermissions('night_programs:write')
  duplicate(
    @Admin() admin: AdminAuthUser,
    @Param('id') id: string,
    @Body() body: NightProgramDuplicateDto,
    @Req() req: Request,
  ) {
    return this.service.duplicate(id, body.title_suffix, {
      adminId: admin.adminId,
      ip: req.ip,
      userAgent: req.headers['user-agent'] ?? null,
    });
  }

  @Delete(':id')
  @RequirePermissions('night_programs:write')
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

class NightProgramListQueryDto {
  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

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

class NightProgramCreateDto {
  @IsString()
  title!: string;

  @IsString()
  type!: string;

  @IsOptional()
  @IsInt()
  duration_sec?: number | null;

  @IsOptional()
  @IsObject()
  content?: Record<string, unknown>;

  @IsOptional()
  @IsArray()
  moods?: string[];

  @IsOptional()
  @IsArray()
  direction_tags?: string[];

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

class NightProgramUpdateDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsInt()
  duration_sec?: number | null;

  @IsOptional()
  @IsObject()
  content?: Record<string, unknown> | null;

  @IsOptional()
  @IsArray()
  moods?: string[] | null;

  @IsOptional()
  @IsArray()
  direction_tags?: string[] | null;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

class NightProgramDuplicateDto {
  @IsOptional()
  @IsString()
  title_suffix?: string;
}
