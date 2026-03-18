import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { AdminAuthUser } from './interfaces/admin-auth-user.interface';

@Injectable()
export class AdminAuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async login(email: string, password: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPassword = password.trim();

    if (!normalizedEmail || !normalizedPassword) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const admin = await this.prisma.adminUser.findUnique({
      where: { email: normalizedEmail },
      include: {
        role: true,
      },
    });

    if (admin) {
      if (!admin.isActive) {
        throw new UnauthorizedException('Admin account is disabled');
      }

      if (!this.verifyPassword(admin.passwordHash, normalizedPassword)) {
        throw new UnauthorizedException('Invalid credentials');
      }

      const payload: AdminAuthUser = {
        adminId: admin.id,
        email: admin.email,
        roleName: admin.role.name,
      };

      return {
        accessToken: this.jwtService.sign(payload),
        admin: payload,
      };
    }

    const bootstrapAdmin = this.getBootstrapAdmin();
    if (
      bootstrapAdmin.bootstrapEmail &&
      bootstrapAdmin.bootstrapPassword &&
      normalizedEmail === bootstrapAdmin.bootstrapEmail &&
      normalizedPassword === bootstrapAdmin.bootstrapPassword
    ) {
      const payload: AdminAuthUser = {
        adminId: `bootstrap:${bootstrapAdmin.bootstrapEmail}`,
        email: bootstrapAdmin.bootstrapEmail,
        roleName: 'super_admin',
      };

      return {
        accessToken: this.jwtService.sign(payload),
        admin: payload,
      };
    }

    throw new UnauthorizedException('Invalid credentials');
  }

  async getMe(admin: AdminAuthUser) {
    if (admin.adminId.startsWith('bootstrap:')) {
      return admin;
    }

    const currentAdmin = await this.prisma.adminUser.findUnique({
      where: { id: admin.adminId },
      include: {
        role: true,
      },
    });

    if (!currentAdmin || !currentAdmin.isActive) {
      throw new UnauthorizedException('Admin account is unavailable');
    }

    return {
      adminId: currentAdmin.id,
      email: currentAdmin.email,
      roleName: currentAdmin.role.name,
    };
  }

  private verifyPassword(passwordHash: string | null, password: string) {
    if (!passwordHash) {
      return false;
    }

    return passwordHash === password || passwordHash === `plain:${password}`;
  }

  private getBootstrapAdmin() {
    return {
      bootstrapEmail:
        this.configService.get<string>('adminAuth.bootstrapEmail')?.trim().toLowerCase() ?? '',
      bootstrapPassword: this.configService.get<string>('adminAuth.bootstrapPassword')?.trim() ?? '',
    };
  }
}
