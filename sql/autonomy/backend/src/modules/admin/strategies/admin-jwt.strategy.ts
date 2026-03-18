import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AdminAuthUser } from '../interfaces/admin-auth-user.interface';

@Injectable()
export class AdminJwtStrategy extends PassportStrategy(Strategy, 'admin-jwt') {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('adminJwt.secret'),
    });
  }

  validate(payload: Partial<AdminAuthUser>) {
    if (!payload.adminId || !payload.email) {
      throw new UnauthorizedException('Invalid admin token payload');
    }

    return payload as AdminAuthUser;
  }
}
