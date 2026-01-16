import { HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BusinessException } from '../../common/exceptions/business.exception';
import { AppErrorCode } from '../../common/exceptions/app-error-code';
import {
  DIRECTION_DEFS,
  NIGHT_PROGRAMS,
  REVIEW_IDENTITY_LABELS,
  TRACE_TAG_LABELS,
  YEAR_THEMES,
} from '../../common/constants/app-config';
import { formatDate } from '../../common/utils/date-utils';

@Injectable()
export class YearService {
  constructor(private readonly prisma: PrismaService) {}

  getThemes() {
    return { themes: YEAR_THEMES };
  }

  async createPlan(userId: string, year: number, themeId: string) {
    const theme = YEAR_THEMES.find((item) => item.theme_id === themeId);
    if (!theme) {
      throw new BusinessException(
        AppErrorCode.INVALID_REQUEST,
        'Theme not found',
        HttpStatus.BAD_REQUEST,
      );
    }

    const plan = await this.prisma.yearPlan.upsert({
      where: { user_id_year: { user_id: userId, year } },
      create: {
        user_id: userId,
        year,
        theme_id: themeId,
        theme_title: theme.title,
        status: 'active',
      },
      update: {
        theme_id: themeId,
        theme_title: theme.title,
        status: 'active',
      },
    });

    await this.prisma.yearDirection.createMany({
      data: DIRECTION_DEFS.map((direction) => ({
        plan_id: plan.id,
        direction_id: direction.direction_id,
        title: direction.title,
        is_enabled: direction.is_enabled,
        sort_order: direction.sort_order,
      })),
      skipDuplicates: true,
    });

    return {
      plan_id: plan.id,
      year: plan.year,
      theme_id: plan.theme_id,
      theme_title: plan.theme_title,
    };
  }

  async getPlan(userId: string, year: number) {
    const plan = await this.prisma.yearPlan.findFirst({
      where: { user_id: userId, year },
      include: { directions: true },
    });

    if (!plan) {
      return { plan: null, directions: [] };
    }

    return {
      plan: {
        id: plan.id,
        year: plan.year,
        theme_id: plan.theme_id,
        theme_title: plan.theme_title,
      },
      directions: plan.directions
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((direction) => ({
          id: direction.id,
          direction_id: direction.direction_id,
          title: direction.title,
          is_enabled: direction.is_enabled,
          sort_order: direction.sort_order,
        })),
    };
  }

  async updateDirections(
    userId: string,
    planId: string,
    directions: Array<{
      direction_id: string;
      is_enabled: boolean;
      sort_order: number;
    }>,
  ) {
    const plan = await this.prisma.yearPlan.findFirst({
      where: { id: planId, user_id: userId },
    });

    if (!plan) {
      throw new BusinessException(
        AppErrorCode.PLAN_NOT_FOUND,
        'Plan not found',
        HttpStatus.NOT_FOUND,
      );
    }

    await this.prisma.$transaction(
      directions.map((direction) => {
        const def = DIRECTION_DEFS.find(
          (item) => item.direction_id === direction.direction_id,
        );
        return this.prisma.yearDirection.upsert({
          where: {
            plan_id_direction_id: {
              plan_id: planId,
              direction_id: direction.direction_id,
            },
          },
          create: {
            plan_id: planId,
            direction_id: direction.direction_id,
            title: def?.title ?? direction.direction_id,
            is_enabled: direction.is_enabled,
            sort_order: direction.sort_order,
          },
          update: {
            is_enabled: direction.is_enabled,
            sort_order: direction.sort_order,
          },
        });
      }),
    );

    return { updated: true };
  }

  async getSummary(userId: string, year: number) {
    const plan = await this.prisma.yearPlan.findFirst({
      where: { user_id: userId, year },
    });

    if (!plan) {
      return {
        plan: null,
        trace_counts: [],
        direction_counts: [],
        soft_identity: null,
      };
    }

    const traceGroups = await this.prisma.traceEvent.groupBy({
      where: { user_id: userId, year },
      by: ['trace_tag'],
      _count: { _all: true },
    });

    const directionGroups = await this.prisma.traceEvent.groupBy({
      where: { user_id: userId, year, direction_id: { not: null } },
      by: ['direction_id'],
      _count: { _all: true },
    });

    const traceCounts = traceGroups.map((group) => ({
      trace_tag: group.trace_tag,
      count: group._count._all,
      label: TRACE_TAG_LABELS[group.trace_tag] ?? group.trace_tag,
    }));

    const directionCounts = directionGroups.map((group) => {
      const def = DIRECTION_DEFS.find(
        (item) => item.direction_id === group.direction_id,
      );
      return {
        direction_id: group.direction_id ?? '',
        count: group._count._all,
        title: def?.title ?? group.direction_id ?? '',
      };
    });

    const sortedTags = [...traceCounts].sort((a, b) => b.count - a.count);
    const reasonTags = sortedTags.slice(0, 2).map((item) => item.trace_tag);
    const identityTag = reasonTags[0];
    const identityTitle = identityTag
      ? REVIEW_IDENTITY_LABELS[identityTag] ?? TRACE_TAG_LABELS[identityTag]
      : null;

    return {
      plan: {
        id: plan.id,
        year: plan.year,
        theme_title: plan.theme_title,
      },
      trace_counts: traceCounts,
      direction_counts: directionCounts,
      soft_identity: identityTitle
        ? { title: identityTitle, reason_tags: reasonTags }
        : null,
    };
  }

  async getDirectionDetail(userId: string, year: number, directionId: string) {
    const def = DIRECTION_DEFS.find((item) => item.direction_id === directionId);

    const traceGroups = await this.prisma.traceEvent.groupBy({
      where: { user_id: userId, year, direction_id: directionId },
      by: ['trace_tag'],
      _count: { _all: true },
    });

    const traceCounts = traceGroups.map((group) => ({
      trace_tag: group.trace_tag,
      count: group._count._all,
      label: TRACE_TAG_LABELS[group.trace_tag] ?? group.trace_tag,
    }));

    const templates = await this.prisma.taskTemplate.findMany({
      where: { is_active: true, deleted_at: null },
    });

    const recommended = templates
      .filter((template) =>
        Array.isArray(template.direction_tags)
          ? template.direction_tags.includes(directionId)
          : false,
      )
      .slice(0, 3)
      .map((template) => ({
        id: template.id,
        title: template.title,
        type: template.type,
      }));

    return {
      direction: {
        direction_id: directionId,
        title: def?.title ?? directionId,
      },
      trace_counts: traceCounts,
      recommended_templates: recommended,
    };
  }

  async getMonthRecords(userId: string, year: number, month: number) {
    const start = new Date(Date.UTC(year, month - 1, 1));
    const end = new Date(Date.UTC(year, month, 1));

    const tasks = await this.prisma.dailyTask.findMany({
      where: {
        status: 'done',
        set: {
          is: {
            user_id: userId,
            date: { gte: start, lt: end },
          },
        },
      },
      include: { set: true, template: true },
    });

    const nightSessions = await this.prisma.nightSession.findMany({
      where: {
        user_id: userId,
        status: 'finished',
        date: { gte: start, lt: end },
      },
    });

    const taskIds = tasks.map((task) => task.id);
    const nightIds = nightSessions.map((session) => session.id);

    const notes = await this.prisma.microNote.findMany({
      where: {
        user_id: userId,
        related_type: { in: ['daily_task', 'night_session'] },
        related_id: { in: [...taskIds, ...nightIds] },
      },
    });

    const noteMap = new Map(
      notes.map((note) => [note.related_id, note.content]),
    );

    const items = [
      ...tasks.map((task) => ({
        type: 'daily_task',
        id: task.id,
        date: formatDate(task.set.date),
        title: task.template.title,
        note: noteMap.get(task.id) ?? null,
      })),
      ...nightSessions.map((session) => {
        const program = NIGHT_PROGRAMS.find(
          (item) => item.program_id === session.program_id,
        );
        return {
          type: 'night_session',
          id: session.id,
          date: formatDate(session.date),
          title: program?.title ?? session.program_id,
          note: noteMap.get(session.id) ?? null,
        };
      }),
    ];

    items.sort((a, b) => (a.date < b.date ? 1 : -1));

    return { month, items };
  }

  async getRecordDetail(
    userId: string,
    type: 'daily_task' | 'night_session',
    id: string,
  ) {
    if (type === 'daily_task') {
      const task = await this.prisma.dailyTask.findFirst({
        where: { id },
        include: { set: true, template: true },
      });

      if (!task || task.set.user_id !== userId) {
        throw new BusinessException(
          AppErrorCode.TASK_NOT_FOUND,
          'Task not found',
          HttpStatus.NOT_FOUND,
        );
      }

      const note = await this.prisma.microNote.findFirst({
        where: {
          user_id: userId,
          related_type: 'daily_task',
          related_id: id,
        },
      });

      const traceTags = Array.isArray(task.template.trace_tags)
        ? task.template.trace_tags
        : [];

      return {
        type,
        id,
        date: formatDate(task.set.date),
        template: {
          title: task.template.title,
          description: task.template.description,
        },
        note: note
          ? { note_id: note.id, content: note.content, mood: note.mood }
          : null,
        trace_tags: traceTags,
      };
    }

    const session = await this.prisma.nightSession.findFirst({
      where: { id, user_id: userId },
    });

    if (!session) {
      throw new BusinessException(
        AppErrorCode.NIGHT_SESSION_NOT_FOUND,
        'Night session not found',
        HttpStatus.NOT_FOUND,
      );
    }

    const note = await this.prisma.microNote.findFirst({
      where: {
        user_id: userId,
        related_type: 'night_session',
        related_id: id,
      },
    });

    const program = NIGHT_PROGRAMS.find(
      (item) => item.program_id === session.program_id,
    );

    return {
      type,
      id,
      date: formatDate(session.date),
      program: program
        ? { title: program.title, type: program.type }
        : { title: session.program_id, type: 'unknown' },
      note: note ? { note_id: note.id, content: note.content, mood: note.mood } : null,
      trace_tags: program?.trace_tags ?? [],
    };
  }

  async generateReview(userId: string, year: number) {
    const plan = await this.prisma.yearPlan.findFirst({
      where: { user_id: userId, year },
    });

    if (!plan) {
      throw new BusinessException(
        AppErrorCode.PLAN_NOT_FOUND,
        'Plan not found',
        HttpStatus.NOT_FOUND,
      );
    }

    const traceGroups = await this.prisma.traceEvent.groupBy({
      where: { user_id: userId, year },
      by: ['trace_tag'],
      _count: { _all: true },
    });

    const sorted = traceGroups.sort((a, b) => b._count._all - a._count._all);
    const highlights = sorted.slice(0, 2).map((group) => {
      const label = TRACE_TAG_LABELS[group.trace_tag] ?? group.trace_tag;
      return `你${label} ${group._count._all} 次`;
    });

    const identityTag = sorted[0]?.trace_tag;
    const identity =
      (identityTag && REVIEW_IDENTITY_LABELS[identityTag]) ?? '会为自己留空间的人';
    const themeCore = plan.theme_title.replace('的一年', '');

    const content = {
      title: `这一年，你慢慢靠近了${themeCore}的状态`,
      highlights,
      identity,
      closing: '这一年，没有被浪费。',
    };

    const snapshot = await this.prisma.reviewSnapshot.create({
      data: {
        user_id: userId,
        plan_id: plan.id,
        year,
        content_json: content,
      },
    });

    return { review_id: snapshot.id, content };
  }

  async generatePoster(userId: string, reviewId: string, template: string) {
    const review = await this.prisma.reviewSnapshot.findFirst({
      where: { id: reviewId, user_id: userId },
    });

    if (!review) {
      throw new BusinessException(
        AppErrorCode.REVIEW_NOT_FOUND,
        'Review not found',
        HttpStatus.NOT_FOUND,
      );
    }

    const posterUrl =
      review.poster_url ?? `/posters/${reviewId}-${template}.png`;

    if (!review.poster_url) {
      await this.prisma.reviewSnapshot.update({
        where: { id: reviewId },
        data: { poster_url: posterUrl },
      });
    }

    return { poster_url: posterUrl };
  }
}
