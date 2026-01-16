import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { AdminAuthController } from './admin-auth.controller';
import { AdminAuthService } from './admin-auth.service';
import { AdminJwtStrategy } from './strategies/admin-jwt.strategy';
import { AdminAuditController } from './admin-audit.controller';
import { AdminAuditService } from './admin-audit.service';
import { AdminTaskTemplatesController } from './admin-task-templates.controller';
import { AdminTaskTemplatesService } from './admin-task-templates.service';
import { AdminNightProgramsController } from './admin-night-programs.controller';
import { AdminNightProgramsService } from './admin-night-programs.service';
import { AdminCopyTemplatesController } from './admin-copy-templates.controller';
import { AdminCopyTemplatesService } from './admin-copy-templates.service';
import { AdminConfigsController } from './admin-configs.controller';
import { AdminConfigsService } from './admin-configs.service';
import { AdminFeedbackController } from './admin-feedback.controller';
import { AdminFeedbackService } from './admin-feedback.service';
import { AdminDashboardController } from './admin-dashboard.controller';
import { AdminDashboardService } from './admin-dashboard.service';
import { AdminDictionariesController } from './admin-dictionaries.controller';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('adminJwt.secret'),
        signOptions: {
          expiresIn: configService.get<string>('adminJwt.expiresIn'),
        },
      }),
    }),
  ],
  controllers: [
    AdminAuthController,
    AdminAuditController,
    AdminTaskTemplatesController,
    AdminNightProgramsController,
    AdminCopyTemplatesController,
    AdminConfigsController,
    AdminFeedbackController,
    AdminDashboardController,
    AdminDictionariesController,
  ],
  providers: [
    AdminAuthService,
    AdminAuditService,
    AdminTaskTemplatesService,
    AdminNightProgramsService,
    AdminCopyTemplatesService,
    AdminConfigsService,
    AdminFeedbackService,
    AdminDashboardService,
    AdminJwtStrategy,
  ],
})
export class AdminModule {}
