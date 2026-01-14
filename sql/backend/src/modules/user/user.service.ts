import { HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BusinessException } from '../../common/exceptions/business.exception';
import { AppErrorCode } from '../../common/exceptions/app-error-code';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async getById(id: number) {
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
      where: { openId },
    });
  }

  createWeChatUser(params: {
    openId: string;
    unionId?: string;
    nickname?: string;
    avatarUrl?: string;
  }) {
    return this.prisma.user.create({
      data: {
        openId: params.openId,
        unionId: params.unionId ?? null,
        nickname: params.nickname ?? null,
        avatarUrl: params.avatarUrl ?? null,
      },
    });
  }
}
