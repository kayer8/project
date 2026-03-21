import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration';
import { validateEnv } from './config/validation';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './modules/health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { AdminModule } from './modules/admin/admin.module';
import { UserModule } from './modules/user/user.module';
import { HouseModule } from './modules/house/house.module';
import { MemberModule } from './modules/member/member.module';
import { BuildingModule } from './modules/building/building.module';
import { DisclosureModule } from './modules/disclosure/disclosure.module';
import { AuditLogModule } from './modules/audit-log/audit-log.module';
import { ManagementFeeModule } from './modules/management-fee/management-fee.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validate: validateEnv,
    }),
    PrismaModule,
    HealthModule,
    AuthModule,
    UserModule,
    HouseModule,
    MemberModule,
    BuildingModule,
    DisclosureModule,
    AuditLogModule,
    ManagementFeeModule,
    AdminModule,
  ],
})
export class AppModule {}
