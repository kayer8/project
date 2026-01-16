import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { User } from '../../common/decorators/user.decorator';
import { AuthUser } from '../auth/interfaces/auth-user.interface';
import { BootstrapService } from './bootstrap.service';

@ApiTags('bootstrap')
@ApiBearerAuth()
@Controller('bootstrap')
export class BootstrapController {
  constructor(private readonly bootstrapService: BootstrapService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  getBootstrap(@User() user: AuthUser) {
    return this.bootstrapService.getBootstrap(user.userId);
  }
}
