import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AdminJwtAuthGuard } from '../../common/guards/admin-jwt-auth.guard';
import { UserService } from '../user/user.service';
import {
  AdminUserListQueryDto,
  CreateAdminUserDto,
  UpdateAdminUserDto,
} from '../user/dto/user.dto';

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
  create(@Body() dto: CreateAdminUserDto) {
    return this.userService.createAdmin(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateAdminUserDto) {
    return this.userService.updateAdmin(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.userService.removeAdmin(id);
  }
}
