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
import { BuildingModule } from '../building/building.module';
import { DisclosureModule } from '../disclosure/disclosure.module';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { AdminUsersController } from './admin-users.controller';
import { AdminHousesController } from './admin-houses.controller';
import { AdminMembersController } from './admin-members.controller';
import { AdminBuildingsController } from './admin-buildings.controller';
import { ManagementFeeModule } from '../management-fee/management-fee.module';
import { AdminManagementFeesController } from './admin-management-fees.controller';
import { AdminDisclosureContentsController } from './admin-disclosure-contents.controller';
import { AdminOperationLogsController } from './admin-operation-logs.controller';
import { VoteModule } from '../vote/vote.module';
import { AdminVotesController } from './admin-votes.controller';
import { AdminOwnersController } from './admin-owners.controller';

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
    BuildingModule,
    DisclosureModule,
    AuditLogModule,
    ManagementFeeModule,
    VoteModule,
  ],
  controllers: [
    AdminAuthController,
    AdminUsersController,
    AdminHousesController,
    AdminMembersController,
    AdminBuildingsController,
    AdminDisclosureContentsController,
    AdminOperationLogsController,
    AdminManagementFeesController,
    AdminVotesController,
    AdminOwnersController,
  ],
  providers: [AdminAuthService, AdminJwtStrategy],
})
export class AdminModule {}
