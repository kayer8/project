import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WechatLoginDto } from './dto/wechat-login.dto';
import { WechatRegisterDto } from './dto/wechat-register.dto';
import { WechatService } from './wechat.service';
import { UserService } from '../user/user.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly wechatService: WechatService,
    private readonly userService: UserService,
  ) {}

  async loginWithWeChat(dto: WechatLoginDto) {
    const session = await this.wechatService.codeToSession(dto.code);
    let user = await this.userService.findByWechatOpenid(session.openid);

    if (!user) {
      user = await this.userService.createWeChatUser({
        wechatOpenid: session.openid,
        wechatUnionid: session.unionid,
        nickname: dto.nickname,
        avatarUrl: dto.avatarUrl,
      });
    } else if (dto.nickname || dto.avatarUrl) {
      user = await this.userService.updateWeChatProfile(user.id, {
        nickname: dto.nickname,
        avatarUrl: dto.avatarUrl,
      });
    }

    const payload = { userId: user.id, openid: user.wechatOpenid };

    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user.id,
        nickname: user.nickname ?? '未命名用户',
        avatarUrl: user.avatarUrl ?? null,
        mobile: user.mobile ?? null,
      },
    };
  }

  async registerWithWeChat(dto: WechatRegisterDto) {
    const session = await this.wechatService.codeToSession(dto.code);
    let user = await this.userService.findByWechatOpenid(session.openid);

    if (!user) {
      user = await this.userService.createWeChatUser({
        wechatOpenid: session.openid,
        wechatUnionid: session.unionid,
        nickname: dto.nickname,
        avatarUrl: dto.avatarUrl,
        mobile: dto.mobile,
      });
    } else {
      user = await this.userService.updateWeChatProfile(user.id, {
        nickname: dto.nickname,
        avatarUrl: dto.avatarUrl,
        mobile: dto.mobile,
      });
    }

    const payload = { userId: user.id, openid: user.wechatOpenid };

    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user.id,
        nickname: user.nickname,
        avatarUrl: user.avatarUrl ?? null,
        mobile: user.mobile ?? null,
      },
    };
  }
}
