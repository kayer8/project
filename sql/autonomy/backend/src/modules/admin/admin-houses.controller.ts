import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { Admin } from '../../common/decorators/admin.decorator';
import { AdminJwtAuthGuard } from '../../common/guards/admin-jwt-auth.guard';
import { HouseService } from '../house/house.service';
import {
  AdminHouseListQueryDto,
  CreateAdminHouseArchiveDto,
  CreateAdminHouseDto,
  UpdateAdminHouseArchiveDto,
  UpdateAdminHouseDto,
} from '../house/dto/house.dto';
import { AdminAuthUser } from './interfaces/admin-auth-user.interface';

@ApiTags('admin-houses')
@ApiBearerAuth()
@Controller('admin/v1/houses')
@UseGuards(AdminJwtAuthGuard)
export class AdminHousesController {
  constructor(private readonly houseService: HouseService) {}

  @Get('options/communities')
  communities() {
    return this.houseService.listCommunities();
  }

  @Get('options/buildings')
  buildings() {
    return this.houseService.listBuildings();
  }

  @Get()
  list(@Query() query: AdminHouseListQueryDto) {
    return this.houseService.listAdmin(query);
  }

  @Get(':id')
  detail(@Param('id') id: string) {
    return this.houseService.getAdminDetail(id);
  }

  @Get(':id/archives')
  listArchives(@Param('id') id: string) {
    return this.houseService.listArchivesAdmin(id);
  }

  @Post(':id/archives')
  createArchive(
    @Param('id') id: string,
    @Body() dto: CreateAdminHouseArchiveDto,
    @Admin() admin: AdminAuthUser,
    @Req() request: Request,
  ) {
    return this.houseService.createArchiveAdmin(id, dto, buildAuditContext(admin, request));
  }

  @Patch(':id/archives/:archiveId')
  updateArchive(
    @Param('id') id: string,
    @Param('archiveId') archiveId: string,
    @Body() dto: UpdateAdminHouseArchiveDto,
    @Admin() admin: AdminAuthUser,
    @Req() request: Request,
  ) {
    return this.houseService.updateArchiveAdmin(id, archiveId, dto, buildAuditContext(admin, request));
  }

  @Delete(':id/archives/:archiveId')
  removeArchive(
    @Param('id') id: string,
    @Param('archiveId') archiveId: string,
    @Admin() admin: AdminAuthUser,
    @Req() request: Request,
  ) {
    return this.houseService.removeArchiveAdmin(id, archiveId, buildAuditContext(admin, request));
  }

  @Post()
  create(@Body() dto: CreateAdminHouseDto, @Admin() admin: AdminAuthUser, @Req() request: Request) {
    return this.houseService.createAdmin(dto, buildAuditContext(admin, request));
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateAdminHouseDto, @Admin() admin: AdminAuthUser, @Req() request: Request) {
    return this.houseService.updateAdmin(id, dto, buildAuditContext(admin, request));
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Admin() admin: AdminAuthUser, @Req() request: Request) {
    return this.houseService.removeAdmin(id, buildAuditContext(admin, request));
  }
}

function buildAuditContext(admin: AdminAuthUser, request: Request) {
  return {
    admin,
    ip: request.ip,
    userAgent: request.headers['user-agent'] || null,
  };
}
