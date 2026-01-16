import { Body, Controller, Delete, Get, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { User } from '../../common/decorators/user.decorator';
import { AuthUser } from '../auth/interfaces/auth-user.interface';
import { MeService } from './me.service';
import { ClearDataDto, UpdateSettingsDto } from './dto/me.dto';

@ApiTags('me')
@ApiBearerAuth()
@Controller('me')
@UseGuards(JwtAuthGuard)
export class MeController {
  constructor(private readonly meService: MeService) {}

  @Get()
  getMe(@User() user: AuthUser) {
    return this.meService.getMe(user.userId);
  }

  @Put('settings')
  updateSettings(@User() user: AuthUser, @Body() dto: UpdateSettingsDto) {
    return this.meService.updateSettings(user.userId, dto);
  }

  @Delete('data')
  clearData(@User() user: AuthUser, @Body() dto: ClearDataDto) {
    return this.meService.clearData(user.userId, dto.confirm);
  }
}
