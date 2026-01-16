import { HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BusinessException } from '../../common/exceptions/business.exception';
import { AppErrorCode } from '../../common/exceptions/app-error-code';
import { UpdateSettingsDto } from './dto/me.dto';

@Injectable()
export class MeService {
  constructor(private readonly prisma: PrismaService) {}

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new BusinessException(
        AppErrorCode.USER_NOT_FOUND,
        'User not found',
        HttpStatus.NOT_FOUND,
      );
    }

    let settings = await this.prisma.userSettings.findUnique({
      where: { user_id: userId },
    });

    if (!settings) {
      settings = await this.prisma.userSettings.create({
        data: { user_id: userId },
      });
    }

    const since = new Date();
    since.setDate(since.getDate() - 6);

    const last7DaysTrace = await this.prisma.traceEvent.count({
      where: { user_id: userId, occurred_at: { gte: since } },
    });

    return {
      user: {
        id: user.id,
        nickname: user.nickname,
        avatar_url: user.avatar_url,
      },
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
      light_stats: { last_7_days_trace: last7DaysTrace },
    };
  }

  async updateSettings(userId: string, updates: UpdateSettingsDto) {
    const data = { ...updates };
    await this.prisma.userSettings.upsert({
      where: { user_id: userId },
      create: { user_id: userId, ...data },
      update: data,
    });

    return { updated: true };
  }

  async clearData(userId: string, confirm: boolean) {
    if (!confirm) {
      throw new BusinessException(
        AppErrorCode.INVALID_REQUEST,
        'Confirmation required',
        HttpStatus.BAD_REQUEST,
      );
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.microNote.deleteMany({ where: { user_id: userId } });
      await tx.traceEvent.deleteMany({ where: { user_id: userId } });
      await tx.nightSession.deleteMany({ where: { user_id: userId } });
      await tx.dailyTask.deleteMany({
        where: { set: { is: { user_id: userId } } },
      });
      await tx.dailyTaskSet.deleteMany({ where: { user_id: userId } });
      await tx.reviewSnapshot.deleteMany({ where: { user_id: userId } });
      await tx.yearDirection.deleteMany({
        where: { plan: { is: { user_id: userId } } },
      });
      await tx.yearPlan.deleteMany({ where: { user_id: userId } });
      await tx.feedbackTicket.deleteMany({ where: { user_id: userId } });
    });

    return { cleared: true };
  }
}
