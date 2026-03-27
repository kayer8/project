import { Body, Controller, Get, Patch, Param, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { Admin } from '../../common/decorators/admin.decorator';
import { AdminJwtAuthGuard } from '../../common/guards/admin-jwt-auth.guard';
import { UserService } from '../user/user.service';
import { AdminOwnerListQueryDto } from '../user/dto/owner.dto';
import {
  AdminOwnerReviewListQueryDto,
  ReviewOwnerRequestDto,
} from '../user/dto/owner-review.dto';
import { AdminAuthUser } from './interfaces/admin-auth-user.interface';

@ApiTags('admin-owners')
@ApiBearerAuth()
@Controller('admin/v1/owners')
@UseGuards(AdminJwtAuthGuard)
export class AdminOwnersController {
  constructor(private readonly userService: UserService) {}

  @Get()
  list(@Query() query: AdminOwnerListQueryDto) {
    return this.userService.listOwnersAdmin(query);
  }

  @Get('reviews')
  listReviews(@Query() query: AdminOwnerReviewListQueryDto) {
    return this.userService.listOwnerReviewsAdmin(query);
  }

  @Patch('reviews/:id')
  review(
    @Param('id') id: string,
    @Body() dto: ReviewOwnerRequestDto,
    @Admin() admin: AdminAuthUser,
    @Req() request: Request,
  ) {
    return this.userService.reviewOwnerRequestAdmin(id, dto, buildAuditContext(admin, request));
  }
}

function buildAuditContext(admin: AdminAuthUser, request: Request) {
  return {
    admin,
    ip: request.ip,
    userAgent: request.headers['user-agent'] || null,
  };
}
