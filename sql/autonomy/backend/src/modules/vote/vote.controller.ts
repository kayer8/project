import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { User } from '../../common/decorators/user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AuthUser } from '../auth/interfaces/auth-user.interface';
import {
  CreateUserVoteDto,
  SubmitUserVoteDto,
  UserVoteListQueryDto,
} from './dto/vote.dto';
import { VoteService } from './vote.service';

@ApiTags('votes')
@Controller('votes')
export class VoteController {
  constructor(private readonly voteService: VoteService) {}

  @Get()
  list(@Query() query: UserVoteListQueryDto) {
    return this.voteService.listPublic(query);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('mine')
  listMine(@User() user: AuthUser, @Query() query: UserVoteListQueryDto) {
    return this.voteService.listMine(user.userId, query);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('mine/:id')
  detailMine(@User() user: AuthUser, @Param('id') id: string, @Query('houseId') houseId?: string) {
    return this.voteService.getUserDetail(user.userId, id, houseId);
  }

  @Get(':id')
  detail(@Param('id') id: string) {
    return this.voteService.getPublicDetail(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post()
  create(@User() user: AuthUser, @Body() dto: CreateUserVoteDto) {
    return this.voteService.createUser(user.userId, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post(':id/ballots')
  submit(@User() user: AuthUser, @Param('id') id: string, @Body() dto: SubmitUserVoteDto) {
    return this.voteService.submitUserVote(user.userId, id, dto);
  }
}
