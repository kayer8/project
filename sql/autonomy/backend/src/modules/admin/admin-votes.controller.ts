import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { Admin } from '../../common/decorators/admin.decorator';
import { AdminJwtAuthGuard } from '../../common/guards/admin-jwt-auth.guard';
import { AdminAuthUser } from './interfaces/admin-auth-user.interface';
import {
  AdminVoteListQueryDto,
  CreateAdminVoteDto,
  UpdateAdminVoteDto,
  VoteScopeSummaryQueryDto,
} from '../vote/dto/vote.dto';
import { VoteService } from '../vote/vote.service';

@ApiTags('admin-votes')
@ApiBearerAuth()
@Controller('admin/v1/votes')
@UseGuards(AdminJwtAuthGuard)
export class AdminVotesController {
  constructor(private readonly voteService: VoteService) {}

  @Get()
  list(@Query() query: AdminVoteListQueryDto) {
    return this.voteService.listAdmin(query);
  }

  @Get('scope-summary')
  scopeSummary(@Query() query: VoteScopeSummaryQueryDto) {
    return this.voteService.getScopeSummary(query);
  }

  @Get(':id')
  detail(@Param('id') id: string) {
    return this.voteService.getAdminDetail(id);
  }

  @Post()
  create(@Body() dto: CreateAdminVoteDto, @Admin() admin: AdminAuthUser, @Req() request: Request) {
    return this.voteService.createAdmin(dto, buildAuditContext(admin, request));
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateAdminVoteDto,
    @Admin() admin: AdminAuthUser,
    @Req() request: Request,
  ) {
    return this.voteService.updateAdmin(id, dto, buildAuditContext(admin, request));
  }

  @Patch(':id/publish')
  publish(@Param('id') id: string, @Admin() admin: AdminAuthUser, @Req() request: Request) {
    return this.voteService.publishAdmin(id, buildAuditContext(admin, request));
  }

  @Patch(':id/end')
  end(@Param('id') id: string, @Admin() admin: AdminAuthUser, @Req() request: Request) {
    return this.voteService.endAdmin(id, buildAuditContext(admin, request));
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Admin() admin: AdminAuthUser, @Req() request: Request) {
    return this.voteService.removeAdmin(id, buildAuditContext(admin, request));
  }
}

function buildAuditContext(admin: AdminAuthUser, request: Request) {
  return {
    admin,
    ip: request.ip,
    userAgent: request.headers['user-agent'] || null,
  };
}
