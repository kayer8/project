import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { Admin } from '../../common/decorators/admin.decorator';
import { AdminJwtAuthGuard } from '../../common/guards/admin-jwt-auth.guard';
import { DisclosureService } from '../disclosure/disclosure.service';
import { AdminAuthUser } from './interfaces/admin-auth-user.interface';
import {
  AdminDisclosureContentListQueryDto,
  CreateAdminDisclosureContentDto,
  UpdateAdminDisclosureContentDto,
} from '../disclosure/dto/disclosure-content.dto';

@ApiTags('admin-disclosure-contents')
@ApiBearerAuth()
@Controller('admin/v1/disclosure-contents')
@UseGuards(AdminJwtAuthGuard)
export class AdminDisclosureContentsController {
  constructor(private readonly disclosureService: DisclosureService) {}

  @Get()
  list(@Query() query: AdminDisclosureContentListQueryDto) {
    return this.disclosureService.listAdmin(query);
  }

  @Get(':id')
  detail(@Param('id') id: string) {
    return this.disclosureService.getAdminDetail(id);
  }

  @Post()
  create(@Body() dto: CreateAdminDisclosureContentDto, @Admin() admin: AdminAuthUser, @Req() request: Request) {
    return this.disclosureService.createAdmin(dto, buildAuditContext(admin, request));
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateAdminDisclosureContentDto,
    @Admin() admin: AdminAuthUser,
    @Req() request: Request,
  ) {
    return this.disclosureService.updateAdmin(id, dto, buildAuditContext(admin, request));
  }

  @Patch(':id/publish')
  publish(@Param('id') id: string, @Admin() admin: AdminAuthUser, @Req() request: Request) {
    return this.disclosureService.publishAdmin(id, buildAuditContext(admin, request));
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Admin() admin: AdminAuthUser, @Req() request: Request) {
    return this.disclosureService.removeAdmin(id, buildAuditContext(admin, request));
  }
}

function buildAuditContext(admin: AdminAuthUser, request: Request) {
  return {
    admin,
    ip: request.ip,
    userAgent: request.headers['user-agent'] || null,
  };
}
