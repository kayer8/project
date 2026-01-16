import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class BootstrapService {
  constructor(private readonly prisma: PrismaService) {}

  async getBootstrap(userId: string) {
    let settings = await this.prisma.userSettings.findUnique({
      where: { user_id: userId },
    });

    if (!settings) {
      settings = await this.prisma.userSettings.create({
        data: { user_id: userId },
      });
    }

    const year = new Date().getFullYear();
    const plan = await this.prisma.yearPlan.findFirst({
      where: { user_id: userId, year, status: 'active' },
    });

    return {
      settings: {
        theme: settings.theme,
        font_scale: settings.font_scale,
        motion_enabled: settings.motion_enabled,
        notify_daily_enabled: settings.notify_daily_enabled,
        notify_daily_time: settings.notify_daily_time,
        notify_night_enabled: settings.notify_night_enabled,
        notify_night_time: settings.notify_night_time,
        notify_mode: settings.notify_mode,
        dnd_start: settings.dnd_start,
        dnd_end: settings.dnd_end,
      },
      active_plan: plan
        ? {
            id: plan.id,
            year: plan.year,
            theme_id: plan.theme_id,
            theme_title: plan.theme_title,
          }
        : null,
    };
  }
}
