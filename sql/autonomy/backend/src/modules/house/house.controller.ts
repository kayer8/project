import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { User } from '../../common/decorators/user.decorator';
import { AuthUser } from '../auth/interfaces/auth-user.interface';
import { HouseService } from './house.service';

@ApiTags('houses')
@ApiBearerAuth()
@Controller('houses')
@UseGuards(JwtAuthGuard)
export class HouseController {
  constructor(private readonly houseService: HouseService) {}

  @Get('my')
  listMy(@User() user: AuthUser) {
    return this.houseService.listMine(user.userId);
  }

  @Get(':id')
  getMineHouse(@User() user: AuthUser, @Param('id') id: string) {
    return this.houseService.getMineHouse(user.userId, id);
  }
}
