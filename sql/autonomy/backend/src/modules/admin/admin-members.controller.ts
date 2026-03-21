import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { Admin } from '../../common/decorators/admin.decorator';
import { AdminJwtAuthGuard } from '../../common/guards/admin-jwt-auth.guard';
import { MemberService } from '../member/member.service';
import {
  AdminMemberListQueryDto,
  CreateAdminMemberDto,
  UpdateAdminMemberDto,
} from '../member/dto/member.dto';
import { AdminAuthUser } from './interfaces/admin-auth-user.interface';

@ApiTags('admin-members')
@ApiBearerAuth()
@Controller('admin/v1/members')
@UseGuards(AdminJwtAuthGuard)
export class AdminMembersController {
  constructor(private readonly memberService: MemberService) {}

  @Get()
  list(@Query() query: AdminMemberListQueryDto) {
    return this.memberService.listAdmin(query);
  }

  @Get(':id')
  detail(@Param('id') id: string) {
    return this.memberService.getAdminDetail(id);
  }

  @Post()
  create(@Body() dto: CreateAdminMemberDto, @Admin() admin: AdminAuthUser, @Req() request: Request) {
    return this.memberService.createAdmin(dto, buildAuditContext(admin, request));
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateAdminMemberDto, @Admin() admin: AdminAuthUser, @Req() request: Request) {
    return this.memberService.updateAdmin(id, dto, buildAuditContext(admin, request));
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Admin() admin: AdminAuthUser, @Req() request: Request) {
    return this.memberService.removeAdmin(id, buildAuditContext(admin, request));
  }
}

function buildAuditContext(admin: AdminAuthUser, request: Request) {
  return {
    admin,
    ip: request.ip,
    userAgent: request.headers['user-agent'] || null,
  };
}
