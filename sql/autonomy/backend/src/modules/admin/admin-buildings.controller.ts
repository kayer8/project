import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { Admin } from '../../common/decorators/admin.decorator';
import { AdminJwtAuthGuard } from '../../common/guards/admin-jwt-auth.guard';
import { BuildingService } from '../building/building.service';
import {
  AdminBuildingListQueryDto,
  CreateAdminBuildingDto,
  UpdateAdminBuildingDto,
} from '../building/dto/building.dto';
import { AdminAuthUser } from './interfaces/admin-auth-user.interface';

@ApiTags('admin-buildings')
@ApiBearerAuth()
@Controller('admin/v1/buildings')
@UseGuards(AdminJwtAuthGuard)
export class AdminBuildingsController {
  constructor(private readonly buildingService: BuildingService) {}

  @Get('options')
  options() {
    return this.buildingService.listOptions();
  }

  @Get()
  list(@Query() query: AdminBuildingListQueryDto) {
    return this.buildingService.listAdmin(query);
  }

  @Get(':id')
  detail(@Param('id') id: string) {
    return this.buildingService.getAdminDetail(id);
  }

  @Post()
  create(@Body() dto: CreateAdminBuildingDto, @Admin() admin: AdminAuthUser, @Req() request: Request) {
    return this.buildingService.createAdmin(dto, buildAuditContext(admin, request));
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateAdminBuildingDto, @Admin() admin: AdminAuthUser, @Req() request: Request) {
    return this.buildingService.updateAdmin(id, dto, buildAuditContext(admin, request));
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Admin() admin: AdminAuthUser, @Req() request: Request) {
    return this.buildingService.removeAdmin(id, buildAuditContext(admin, request));
  }
}

function buildAuditContext(admin: AdminAuthUser, request: Request) {
  return {
    admin,
    ip: request.ip,
    userAgent: request.headers['user-agent'] || null,
  };
}
