import { CanActivate, ExecutionContext, HttpStatus, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { BusinessException } from '../exceptions/business.exception';
import { AppErrorCode } from '../exceptions/app-error-code';
import { REQUIRED_PERMISSIONS_KEY } from '../decorators/permissions.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[]>(
      REQUIRED_PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!required || required.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{ user?: unknown }>();
    const admin = request.user as
      | { permissions?: Record<string, boolean>; roleName?: string }
      | undefined;

    if (admin?.roleName === 'super_admin') {
      return true;
    }

    if (!admin?.permissions) {
      throw new BusinessException(
        AppErrorCode.PERMISSION_DENIED,
        'Permission denied',
        HttpStatus.FORBIDDEN,
      );
    }

    const hasAll = required.every((perm) => admin.permissions?.[perm]);
    if (!hasAll) {
      throw new BusinessException(
        AppErrorCode.PERMISSION_DENIED,
        'Permission denied',
        HttpStatus.FORBIDDEN,
      );
    }

    return true;
  }
}
