import { HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BusinessException } from '../../common/exceptions/business.exception';
import { AppErrorCode } from '../../common/exceptions/app-error-code';
import {
  REFRESH_LIMIT,
} from '../../common/constants/app-config';
import { formatDateInTimeZone, parseDateInput } from '../../common/utils/date-utils';

const TASKS_PER_DAY = 3;

@Injectable()
export class TodayService {
  constructor(private readonly prisma: PrismaService) {}

  async getToday(userId: string, date?: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const timeZone = user?.timezone ?? 'Asia/Shanghai';
    const dateString = date ?? formatDateInTimeZone(new Date(), timeZone);
    const dateValue = parseDateInput(dateString);

    const { set, tasks } = await this.ensureTaskSet(userId, dateValue);
    const latestTasks = this.selectLatestTasks(tasks);

    return {
      date: dateString,
      set: {
        id: set.id,
        refresh_count: set.refresh_count,
        refresh_limit: REFRESH_LIMIT,
      },
      tasks: latestTasks
        .sort((a, b) => a.position - b.position)
        .map((task) => ({
          daily_task_id: task.id,
          status: task.status,
          position: task.position,
          template: {
            id: task.template.id,
            title: task.template.title,
            description: task.template.description,
            type: task.template.type,
            default_duration_sec: task.template.default_duration_sec ?? null,
            steps: Array.isArray(task.template.steps_json)
              ? task.template.steps_json
              : [],
          },
        })),
      night_entry: { available: true },
    };
  }

  async refreshTask(
    userId: string,
    date: string,
    mood: string | undefined,
    replacePosition: number,
    reason: string | undefined,
  ) {
    const dateValue = parseDateInput(date);
    const { set, tasks } = await this.ensureTaskSet(userId, dateValue);
    const latestTasks = this.selectLatestTasks(tasks);

    if (set.refresh_count >= REFRESH_LIMIT) {
      throw new BusinessException(
        AppErrorCode.REFRESH_LIMIT_REACHED,
        'Refresh limit reached',
        HttpStatus.BAD_REQUEST,
      );
    }

    const target = latestTasks.find(
      (task) => task.position === replacePosition,
    );
    if (!target) {
      throw new BusinessException(
        AppErrorCode.TASK_NOT_FOUND,
        'Task not found',
        HttpStatus.NOT_FOUND,
      );
    }

    const existingTemplateIds = new Set(
      latestTasks.map((task) => task.template_id),
    );
    const newTemplate = await this.pickTemplate(existingTemplateIds, mood);
    if (!newTemplate) {
      throw new BusinessException(
        AppErrorCode.INVALID_REQUEST,
        'No template available',
        HttpStatus.BAD_REQUEST,
      );
    }

    const [updatedSet, newTask] = await this.prisma.$transaction([
      this.prisma.dailyTaskSet.update({
        where: { id: set.id },
        data: { refresh_count: set.refresh_count + 1, source: 'refreshed' },
      }),
      this.prisma.dailyTask.create({
        data: {
          set_id: set.id,
          template_id: newTemplate.id,
          position: replacePosition,
          status: 'pending',
          replaced_from_task_id: target.id,
        },
        include: { template: true },
      }),
    ]);

    await this.prisma.dailyTask.update({
      where: { id: target.id },
      data: {
        status: 'skipped',
        skipped_at: new Date(),
        skip_reason: reason ?? 'refreshed',
      },
    });

    return {
      refresh_count: updatedSet.refresh_count,
      replaced: {
        position: replacePosition,
        new_daily_task_id: newTask.id,
        template: {
          id: newTask.template.id,
          title: newTask.template.title,
          type: newTask.template.type,
        },
      },
    };
  }

  private async ensureTaskSet(userId: string, date: Date) {
    let set = await this.prisma.dailyTaskSet.findUnique({
      where: { user_id_date: { user_id: userId, date } },
    });

    if (!set) {
      const templates = await this.prisma.taskTemplate.findMany({
        where: { is_active: true, deleted_at: null },
      });
      const selected = this.pickTemplates(templates, TASKS_PER_DAY);

      const created = await this.prisma.$transaction(async (tx) => {
        const createdSet = await tx.dailyTaskSet.create({
          data: { user_id: userId, date, source: 'auto' },
        });

        const createdTasks = await Promise.all(
          selected.map((template, index) =>
            tx.dailyTask.create({
              data: {
                set_id: createdSet.id,
                template_id: template.id,
                position: index + 1,
                status: 'pending',
              },
            }),
          ),
        );

        return { set: createdSet, tasks: createdTasks };
      });

      set = created.set;
    }

    const tasks = await this.prisma.dailyTask.findMany({
      where: { set_id: set.id },
      include: { template: true },
    });

    return { set, tasks };
  }

  private selectLatestTasks(
    tasks: Array<{
      id: string;
      position: number;
      created_at: Date;
      status: string;
      template_id: string;
      template: {
        id: string;
        title: string;
        description: string;
        type: string;
        default_duration_sec: number | null;
        steps_json: unknown;
      };
    }>,
  ) {
    const latestByPosition = new Map<number, (typeof tasks)[number]>();
    tasks.forEach((task) => {
      const existing = latestByPosition.get(task.position);
      if (!existing || task.created_at > existing.created_at) {
        latestByPosition.set(task.position, task);
      }
    });
    return Array.from(latestByPosition.values());
  }

  private pickTemplates(templates: Array<{ id: string }>, count: number) {
    const shuffled = [...templates];
    for (let i = shuffled.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled.slice(0, count);
  }

  private async pickTemplate(existingIds: Set<string>, mood?: string) {
    const templates = await this.prisma.taskTemplate.findMany({
      where: { is_active: true, deleted_at: null },
    });

    const filtered = mood
      ? templates.filter((template) =>
          Array.isArray(template.moods)
            ? template.moods.includes(mood)
            : false,
        )
      : templates;

    const available = (filtered.length ? filtered : templates).filter(
      (template) => !existingIds.has(template.id),
    );

    if (!available.length) {
      return null;
    }

    const index = Math.floor(Math.random() * available.length);
    return available[index];
  }
}
