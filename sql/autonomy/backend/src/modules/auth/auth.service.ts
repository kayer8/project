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
    const user = await this.userService.findByWechatOpenid(session.openid);

    if (!user) {
      return {
        needRegister: true,
        accessToken: null,
        user: null,
      };
    }

    const hydratedUser =
      dto.nickname || dto.avatarUrl
        ? await this.userService.updateWeChatProfile(user.id, {
            nickname: dto.nickname,
            avatarUrl: dto.avatarUrl,
          })
        : user;

    return {
      needRegister: !hydratedUser.mobile,
      accessToken: hydratedUser.mobile
        ? this.signUserToken(hydratedUser.id, hydratedUser.wechatOpenid)
        : null,
      user: this.mapAuthUser(hydratedUser),
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

    return {
      needRegister: false,
      accessToken: this.signUserToken(user.id, user.wechatOpenid),
      user: this.mapAuthUser(user),
    };
  }

  private signUserToken(userId: string, openid: string) {
    return this.jwtService.sign({ userId, openid });
  }

  private mapAuthUser(user: {
    id: string;
    nickname: string | null;
    avatarUrl: string | null;
    mobile: string | null;
    realName?: string | null;
  }) {
    return {
      id: user.id,
      nickname: user.nickname ?? '未命名用户',
      avatarUrl: user.avatarUrl ?? null,
      mobile: user.mobile ?? null,
      realName: user.realName ?? null,
    };
  }
}
