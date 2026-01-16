import { Body, Controller, Post } from '@nestjs/common';
import { ApiBody, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { WechatLoginDto } from './dto/wechat-login.dto';
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

  @Post('wechat/register')
  @ApiBody({ type: WechatRegisterDto })
  register(@Body() dto: WechatRegisterDto) {
    return this.authService.registerWithWeChat(dto);
  }
}
