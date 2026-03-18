import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AdminJwtAuthGuard } from '../../common/guards/admin-jwt-auth.guard';
import { MemberService } from '../member/member.service';
import {
  AdminMemberListQueryDto,
  CreateAdminMemberDto,
  UpdateAdminMemberDto,
} from '../member/dto/member.dto';

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
  create(@Body() dto: CreateAdminMemberDto) {
    return this.memberService.createAdmin(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateAdminMemberDto) {
    return this.memberService.updateAdmin(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.memberService.removeAdmin(id);
  }
}
