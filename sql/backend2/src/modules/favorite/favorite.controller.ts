import { Controller, Delete, Param, ParseIntPipe, Post, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { FavoriteService } from './favorite.service';
import { BusinessException } from '../../common/exceptions/business.exception';
import { AppErrorCode } from '../../common/exceptions/app-error-code';

@ApiTags('Favorites')
@Controller('api/favorites')
export class FavoriteController {
  constructor(private readonly favoriteService: FavoriteService) {}

  @Post(':boothId')
  add(
    @Param('boothId', ParseIntPipe) boothId: number,
    @Req() req: Request,
  ) {
    const userId = this.getUserId(req);
    return this.favoriteService.addFavorite(userId, boothId);
  }

  @Delete(':boothId')
  remove(
    @Param('boothId', ParseIntPipe) boothId: number,
    @Req() req: Request,
  ) {
    const userId = this.getUserId(req);
    return this.favoriteService.removeFavorite(userId, boothId);
  }

  private getUserId(req: Request) {
    const headerValue = req.headers['x-user-id'] ?? req.headers['x-userid'];
    const fallback = (req.query.user_id as string) ?? (req.body?.user_id as string);
    const raw = (headerValue as string) ?? fallback;
    const userId = raw ? Number(raw) : NaN;
    if (!userId || Number.isNaN(userId)) {
      throw new BusinessException(
        AppErrorCode.INVALID_REQUEST,
        'User id is required via x-user-id header or user_id param',
      );
    }
    return userId;
  }
}
