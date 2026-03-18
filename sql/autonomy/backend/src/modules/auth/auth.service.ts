import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WechatLoginDto } from './dto/wechat-login.dto';
import { WechatRegisterDto } from './dto/wechat-register.dto';
import { WechatService } from './wechat.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly wechatService: WechatService,
  ) {}

  async loginWithWeChat(dto: WechatLoginDto) {
    const session = await this.wechatService.codeToSession(dto.code);
    const payload = { userId: session.openid, openid: session.openid };

    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: session.openid,
        nickname: dto.nickname ?? '未命名用户',
        avatarUrl: dto.avatarUrl ?? null,
      },
    };
  }

  async registerWithWeChat(dto: WechatRegisterDto) {
    const session = await this.wechatService.codeToSession(dto.code);
    const payload = { userId: session.openid, openid: session.openid };

    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: session.openid,
        nickname: dto.nickname,
        avatarUrl: dto.avatarUrl ?? null,
        mobile: dto.mobile ?? null,
      },
    };
  }
}
