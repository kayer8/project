import { HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BusinessException } from '../../common/exceptions/business.exception';
import { AppErrorCode } from '../../common/exceptions/app-error-code';

@Injectable()
export class FavoriteService {
  constructor(private readonly prisma: PrismaService) {}

  async addFavorite(userId: number, boothId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: BigInt(userId) },
    });
    if (!user) {
      throw new BusinessException(
        AppErrorCode.USER_NOT_FOUND,
        'User not found',
        HttpStatus.NOT_FOUND,
      );
    }

    const booth = await this.prisma.booth.findUnique({
      where: { id: BigInt(boothId) },
    });
    if (!booth) {
      throw new BusinessException(
        AppErrorCode.BOOTH_NOT_FOUND,
        'Booth not found',
        HttpStatus.NOT_FOUND,
      );
    }

    const existing = await this.prisma.userFavorite.findUnique({
      where: { user_id_booth_id: { user_id: user.id, booth_id: booth.id } },
    });
    if (existing) {
      throw new BusinessException(
        AppErrorCode.FAVORITE_EXISTS,
        'Already in favorites',
      );
    }

    return this.prisma.userFavorite.create({
      data: {
        user_id: user.id,
        booth_id: booth.id,
      },
    });
  }

  async removeFavorite(userId: number, boothId: number) {
    const existing = await this.prisma.userFavorite.findUnique({
      where: {
        user_id_booth_id: {
          user_id: BigInt(userId),
          booth_id: BigInt(boothId),
        },
      },
    });
    if (!existing) {
      throw new BusinessException(
        AppErrorCode.FAVORITE_NOT_FOUND,
        'Favorite not found',
        HttpStatus.NOT_FOUND,
      );
    }

    return this.prisma.userFavorite.delete({
      where: { id: existing.id },
    });
  }
}
