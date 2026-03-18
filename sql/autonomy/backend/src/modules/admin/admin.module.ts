import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AdminAuthController } from './admin-auth.controller';
import { AdminAuthService } from './admin-auth.service';
import { AdminJwtStrategy } from './strategies/admin-jwt.strategy';
import { UserModule } from '../user/user.module';
import { HouseModule } from '../house/house.module';
import { MemberModule } from '../member/member.module';
import { AdminUsersController } from './admin-users.controller';
import { AdminHousesController } from './admin-houses.controller';
import { AdminMembersController } from './admin-members.controller';

@Module({
  imports: [
    ConfigModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('adminJwt.secret'),
        signOptions: {
          expiresIn: configService.get<string>('adminJwt.expiresIn'),
        },
      }),
    }),
    UserModule,
    HouseModule,
    MemberModule,
  ],
  controllers: [
    AdminAuthController,
    AdminUsersController,
    AdminHousesController,
    AdminMembersController,
  ],
  providers: [AdminAuthService, AdminJwtStrategy],
})
export class AdminModule {}
