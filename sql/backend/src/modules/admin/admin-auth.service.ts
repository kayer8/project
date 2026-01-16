import { HttpStatus, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { createHash, scryptSync, timingSafeEqual } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { BusinessException } from '../../common/exceptions/business.exception';
import { AppErrorCode } from '../../common/exceptions/app-error-code';
import { AdminAuthUser } from './interfaces/admin-auth-user.interface';

@Injectable()
export class AdminAuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(email: string, password: string) {
    const admin = await this.prisma.adminUser.findUnique({
      where: { email },
      include: { role: true },
    });

    if (!admin) {
      throw new BusinessException(
        AppErrorCode.ADMIN_INVALID_CREDENTIALS,
        'Invalid credentials',
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

    if (!admin.role) {
      throw new BusinessException(
        AppErrorCode.ADMIN_ROLE_NOT_FOUND,
        'Admin role not found',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (!admin.password_hash || !verifyPassword(password, admin.password_hash)) {
      throw new BusinessException(
        AppErrorCode.ADMIN_INVALID_CREDENTIALS,
        'Invalid credentials',
        HttpStatus.UNAUTHORIZED,
      );
    }

    await this.prisma.adminUser.update({
      where: { id: admin.id },
      data: { last_login_at: new Date() },
    });

    const token = this.jwtService.sign({
      sub: admin.id,
      roleId: admin.role_id,
      type: 'admin',
    });

    return {
      token,
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role.name,
      },
    };
  }

  getMe(admin: AdminAuthUser) {
    return {
      admin: {
        id: admin.adminId,
        name: admin.name,
        email: admin.email,
      },
      permissions: admin.permissions,
    };
  }
}

function verifyPassword(password: string, storedHash: string): boolean {
  if (storedHash.startsWith('plain:')) {
    return storedHash.slice('plain:'.length) === password;
  }

  if (storedHash.startsWith('sha256:')) {
    const expected = storedHash.slice('sha256:'.length);
    const actual = createHash('sha256').update(password).digest('hex');
    return expected === actual;
  }

  if (storedHash.startsWith('scrypt$')) {
    const parts = storedHash.split('$');
    if (parts.length !== 3) {
      return false;
    }
    try {
      const salt = Buffer.from(parts[1], 'base64');
      const expected = Buffer.from(parts[2], 'base64');
      const derived = scryptSync(password, salt, expected.length);
      return timingSafeEqual(derived, expected);
    } catch {
      return false;
    }
  }

  const sha256 = createHash('sha256').update(password).digest('hex');
  if (storedHash.length === sha256.length && storedHash === sha256) {
    return true;
  }

  return storedHash === password;
}
