import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { User } from '../../common/decorators/user.decorator';
import { AuthUser } from './interfaces/auth-user.interface';
import { AuthService } from './auth.service';
import { RegisterHouseOptionsQueryDto } from './dto/register-house-options.dto';
import { SubmitRegistrationRequestDto } from './dto/submit-registration-request.dto';
import { WechatLoginDto } from './dto/wechat-login.dto';
import { WechatManualBindDto } from './dto/wechat-manual-bind.dto';
import { WechatPhoneSyncDto } from './dto/wechat-phone-sync.dto';
import { WechatRegisterDto } from './dto/wechat-register.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('wechat_login')
  @ApiBody({ type: WechatLoginDto })
  login(@Body() dto: WechatLoginDto) {
    return this.authService.loginWithWeChat(dto);
  }

  @Post('wechat/phone-sync')
  @ApiBody({ type: WechatPhoneSyncDto })
  syncPhone(@Body() dto: WechatPhoneSyncDto) {
    return this.authService.syncPhoneWithWeChat(dto);
  }

  @Post('wechat/manual-bind')
  @ApiBody({ type: WechatManualBindDto })
  manualBind(@Body() dto: WechatManualBindDto) {
    return this.authService.manualBindWithMobile(dto);
  }

  @Post('wechat/register')
  @ApiBody({ type: WechatRegisterDto })
  register(@Body() dto: WechatRegisterDto) {
    return this.authService.registerWithWeChat(dto);
  }

  @Get('register/buildings')
  listRegisterBuildings() {
    return this.authService.listRegisterBuildings();
  }

  @Get('register/houses')
  listRegisterHouses(@Query() query: RegisterHouseOptionsQueryDto) {
    if (!query.buildingId) {
      return [];
    }

    return this.authService.listRegisterHouses(query.buildingId);
  }

  @Post('wechat/registration-request')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiBody({ type: SubmitRegistrationRequestDto })
  submitRegistrationRequest(
    @User() user: AuthUser,
    @Body() dto: SubmitRegistrationRequestDto,
  ) {
    return this.authService.submitRegistrationRequest(user.userId, dto);
  }
}
