import { HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BusinessException } from '../../common/exceptions/business.exception';
import { AppErrorCode } from '../../common/exceptions/app-error-code';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async getById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });
    if (!user) {
      throw new BusinessException(
        AppErrorCode.USER_NOT_FOUND,
        'User not found',
        HttpStatus.NOT_FOUND,
      );
    }
    return user;
  }

  findByOpenId(openId: string) {
    return this.prisma.user.findUnique({
      where: { openid: openId },
    });
  }

  createWeChatUser(params: {
    openid: string;
    unionid?: string;
    nickname?: string;
    avatar_url?: string;
    timezone?: string;
  }) {
    return this.prisma.user.create({
      data: {
        openid: params.openid,
        unionid: params.unionid ?? null,
        nickname: params.nickname ?? 'ÐÂÓÃ»§',
        avatar_url: params.avatar_url ?? null,
        timezone: params.timezone ?? 'Asia/Shanghai',
      },
    });
  }

  updateWeChatProfile(
    userId: string,
    updates: { nickname?: string; avatar_url?: string },
  ) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(updates.nickname ? { nickname: updates.nickname } : {}),
        ...(updates.avatar_url ? { avatar_url: updates.avatar_url } : {}),
      },
    });
  }
}
