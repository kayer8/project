import { HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BusinessException } from '../../common/exceptions/business.exception';
import { AppErrorCode } from '../../common/exceptions/app-error-code';
import {
  TRACE_TAG_FEEDBACK,
} from '../../common/constants/app-config';
import { getYearMonthFromDate } from '../../common/utils/date-utils';

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}

  async completeTask(
    userId: string,
    dailyTaskId: string,
    completedAt: string,
  ) {
    const task = await this.prisma.dailyTask.findFirst({
      where: { id: dailyTaskId },
      include: { set: true, template: true },
    });

    if (!task || task.set.user_id !== userId) {
      throw new BusinessException(
        AppErrorCode.TASK_NOT_FOUND,
        'Task not found',
        HttpStatus.NOT_FOUND,
      );
    }

    const occurredAt = new Date(completedAt);
    const dateOnly = task.set.date;
    const { year, month } = getYearMonthFromDate(dateOnly);

    await this.prisma.dailyTask.update({
      where: { id: task.id },
      data: { status: 'done', done_at: occurredAt },
    });

    const plan = await this.prisma.yearPlan.findFirst({
      where: { user_id: userId, year },
    });

    const traceTags = this.parseStringArray(task.template.trace_tags);
    const directionTags = this.parseStringArray(task.template.direction_tags);
    const directionId = directionTags[0] ?? null;

    const traceEventsCreated = plan
      ? await Promise.all(
          (traceTags.length ? traceTags : ['self_care']).map((tag) =>
            this.prisma.traceEvent.create({
              data: {
                user_id: userId,
                plan_id: plan.id,
                event_type: 'task_done',
                trace_tag: tag,
                direction_id: directionId,
                source_id: task.id,
                occurred_at: occurredAt,
                date: dateOnly,
                year,
                month,
              },
            }),
          ),
        )
      : [];

    const feedbackKey = traceTags[0] ?? 'default';
    const feedback =
      TRACE_TAG_FEEDBACK[feedbackKey] ?? TRACE_TAG_FEEDBACK.default;

    return {
      daily_task_id: task.id,
      status: 'done',
      feedback,
      trace_events_created: traceEventsCreated.map((event) => ({
        trace_tag: event.trace_tag,
        direction_id: event.direction_id,
        occurred_at: event.occurred_at,
      })),
    };
  }

  async skipTask(userId: string, dailyTaskId: string, reason?: string) {
    const task = await this.prisma.dailyTask.findFirst({
      where: { id: dailyTaskId },
      include: { set: true },
    });

    if (!task || task.set.user_id !== userId) {
      throw new BusinessException(
        AppErrorCode.TASK_NOT_FOUND,
        'Task not found',
        HttpStatus.NOT_FOUND,
      );
    }

    await this.prisma.dailyTask.update({
      where: { id: dailyTaskId },
      data: {
        status: 'skipped',
        skipped_at: new Date(),
        skip_reason: reason ?? null,
      },
    });

    return { daily_task_id: dailyTaskId, status: 'skipped' };
  }

  private parseStringArray(value: unknown): string[] {
    if (!Array.isArray(value)) {
      return [];
    }
    return value.filter((item): item is string => typeof item === 'string');
  }
}
