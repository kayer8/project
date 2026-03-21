import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AdminJwtAuthGuard } from '../../common/guards/admin-jwt-auth.guard';
import { UserService } from '../user/user.service';
import { AdminOwnerListQueryDto } from '../user/dto/owner.dto';

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
}
