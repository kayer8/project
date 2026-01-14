import { HttpStatus, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import { AppErrorCode } from '../../common/exceptions/app-error-code';
import { BusinessException } from '../../common/exceptions/business.exception';
import { WechatService } from './wechat.service';
import { WechatRegisterDto } from './dto/wechat-register.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly wechatService: WechatService,
  ) {}

  async loginWithWeChat(code: string) {
    const session = await this.wechatService.codeToSession(code);
    const user = await this.userService.findByOpenId(session.openId);
    if (!user) {
      throw new BusinessException(
        AppErrorCode.USER_NOT_FOUND,
        'User not registered',
        HttpStatus.NOT_FOUND,
      );
    }

    return this.signUser(user);
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
      openId: session.openId,
      unionId: session.unionId,
      nickname: dto.nickname,
      avatarUrl: dto.avatarUrl,
    });

    return this.signUser(user);
  }

  private signUser(user: { id: number; openId: string }) {
    const token = this.jwtService.sign({ sub: user.id, openId: user.openId });
    return {
      token,
      user,
    };
  }
}
