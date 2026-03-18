import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AdminAuthUser } from './interfaces/admin-auth-user.interface';

@Injectable()
export class AdminAuthService {
  constructor(private readonly jwtService: JwtService) {}

  login(email: string, password: string) {
    if (!email || !password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload: AdminAuthUser = {
      adminId: email,
      email,
      roleName: 'super_admin',
    };

    return {
      accessToken: this.jwtService.sign(payload),
      admin: payload,
    };
  }

  getMe(admin: AdminAuthUser) {
    return admin;
  }
}
