import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { Admin } from '../../common/decorators/admin.decorator';
import { AdminJwtAuthGuard } from '../../common/guards/admin-jwt-auth.guard';
import { UserService } from '../user/user.service';
import {
  AdminUserListQueryDto,
  CreateAdminUserDto,
  UpdateAdminUserDto,
} from '../user/dto/user.dto';
import { AdminAuthUser } from './interfaces/admin-auth-user.interface';

@ApiTags('admin-users')
@ApiBearerAuth()
@Controller('admin/v1/users')
@UseGuards(AdminJwtAuthGuard)
export class AdminUsersController {
  constructor(private readonly userService: UserService) {}

  @Get()
  list(@Query() query: AdminUserListQueryDto) {
    return this.userService.listAdmin(query);
  }

  @Get(':id')
  detail(@Param('id') id: string) {
    return this.userService.getById(id);
  }

  @Post()
  create(@Body() dto: CreateAdminUserDto, @Admin() admin: AdminAuthUser, @Req() request: Request) {
    return this.userService.createAdmin(dto, buildAuditContext(admin, request));
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateAdminUserDto, @Admin() admin: AdminAuthUser, @Req() request: Request) {
    return this.userService.updateAdmin(id, dto, buildAuditContext(admin, request));
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Admin() admin: AdminAuthUser, @Req() request: Request) {
    return this.userService.removeAdmin(id, buildAuditContext(admin, request));
  }
}

function buildAuditContext(admin: AdminAuthUser, request: Request) {
  return {
    admin,
    ip: request.ip,
    userAgent: request.headers['user-agent'] || null,
  };
}
