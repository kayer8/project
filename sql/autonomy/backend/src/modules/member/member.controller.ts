import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { User } from '../../common/decorators/user.decorator';
import { AuthUser } from '../auth/interfaces/auth-user.interface';
import { MemberService } from './member.service';

@ApiTags('members')
@ApiBearerAuth()
@Controller('members')
@UseGuards(JwtAuthGuard)
export class MemberController {
  constructor(private readonly memberService: MemberService) {}

  @Get('my')
  listMine(@User() user: AuthUser) {
    return this.memberService.listMine(user.userId);
  }

  @Get(':id')
  getMineMember(@User() user: AuthUser, @Param('id') id: string) {
    return this.memberService.getMineMember(user.userId, id);
  }
}
