import { HttpStatus, Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { BusinessException } from '../../common/exceptions/business.exception';
import { AppErrorCode } from '../../common/exceptions/app-error-code';
import { AdminAuthUser } from '../interfaces/admin-auth-user.interface';

@Injectable()
export class AdminJwtStrategy extends PassportStrategy(Strategy, 'admin-jwt') {
  constructor(
    configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('adminJwt.secret'),
    });
  }

  async validate(payload: { sub: string; type?: string }): Promise<AdminAuthUser> {
    if (payload.type !== 'admin') {
      throw new BusinessException(
        AppErrorCode.ADMIN_INVALID_CREDENTIALS,
        'Invalid token',
        HttpStatus.UNAUTHORIZED,
      );
    }
    const admin = await this.prisma.adminUser.findUnique({
      where: { id: payload.sub },
      include: { role: true },
    });

    if (!admin) {
      throw new BusinessException(
        AppErrorCode.ADMIN_NOT_FOUND,
        'Admin not found',
        HttpStatus.UNAUTHORIZED,
      );
    }

    if (!admin.is_active) {
      throw new BusinessException(
        AppErrorCode.ADMIN_DISABLED,
        'Admin disabled',
        HttpStatus.FORBIDDEN,
      );
    }

    const permissions =
      admin.role?.permissions_json &&
      typeof admin.role.permissions_json === 'object' &&
      !Array.isArray(admin.role.permissions_json)
        ? (admin.role.permissions_json as Record<string, boolean>)
        : {};

    return {
      adminId: admin.id,
      email: admin.email,
      name: admin.name,
      roleId: admin.role_id,
      roleName: admin.role?.name ?? 'unknown',
      permissions,
    };
  }
}
