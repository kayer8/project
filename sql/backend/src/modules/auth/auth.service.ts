import { HttpStatus, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import { AppErrorCode } from '../../common/exceptions/app-error-code';
import { BusinessException } from '../../common/exceptions/business.exception';
import { WechatService } from './wechat.service';
import { WechatRegisterDto } from './dto/wechat-register.dto';
import { WechatLoginDto } from './dto/wechat-login.dto';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly wechatService: WechatService,
    private readonly prisma: PrismaService,
  ) {}

  async loginWithWeChat(dto: WechatLoginDto) {
    const session = await this.wechatService.codeToSession(dto.code);
    let user = await this.userService.findByOpenId(session.openId);

    if (!user) {
      user = await this.userService.createWeChatUser({
        openid: session.openId,
        unionid: session.unionId,
        nickname: dto.nickname,
        avatar_url: dto.avatar_url,
      });
    } else if (dto.nickname || dto.avatar_url) {
      user = await this.userService.updateWeChatProfile(user.id, {
        nickname: dto.nickname,
        avatar_url: dto.avatar_url,
      });
    }

    await this.ensureUserSettings(user.id);

    const token = this.signUser(user);
    const currentYear = new Date().getFullYear();
    const hasActivePlan = await this.prisma.yearPlan.findFirst({
      where: {
        user_id: user.id,
        status: 'active',
        year: currentYear,
      },
      select: { id: true },
    });

    return {
      token,
      user: {
        id: user.id,
        nickname: user.nickname,
        avatar_url: user.avatar_url,
      },
      has_active_plan: Boolean(hasActivePlan),
      server_time: new Date().toISOString(),
    };
  }

  async registerWithWeChat(dto: WechatRegisterDto) {
    const session = await this.wechatService.codeToSession(dto.code);
    const existing = await this.userService.findByOpenId(session.openId);
    if (existing) {
      throw new BusinessException(
        AppErrorCode.USER_ALREADY_EXISTS,
        'User already exists',
        HttpStatus.CONFLICT,
      );
    }

    const user = await this.userService.createWeChatUser({
      openid: session.openId,
      unionid: session.unionId,
      nickname: dto.nickname,
      avatar_url: dto.avatar_url,
    });

    await this.ensureUserSettings(user.id);

    return {
      token: this.signUser(user),
      user: {
        id: user.id,
        nickname: user.nickname,
        avatar_url: user.avatar_url,
      },
    };
  }

  private signUser(user: { id: string; openid: string }) {
    return this.jwtService.sign({ sub: user.id, openid: user.openid });
  }

  private async ensureUserSettings(userId: string) {
    await this.prisma.userSettings.upsert({
      where: { user_id: userId },
      create: { user_id: userId },
      update: {},
    });
  }
}
