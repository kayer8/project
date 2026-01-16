import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AdminDashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async overview(dateFrom?: string, dateTo?: string) {
    const { start, end, dates } = buildDateRange(dateFrom, dateTo);
    const dailyStats = await Promise.all(
      dates.map((date) => this.computeDailyStats(date)),
    );

    const today = dailyStats[dailyStats.length - 1] ?? emptyDaily();
    const yesterday = dailyStats[dailyStats.length - 2] ?? emptyDaily();

    return {
      cards: {
        dau: buildCard(today.dau, yesterday.dau),
        new_users: buildCard(today.new_users, yesterday.new_users),
        task_done_rate: buildCard(today.task_done_rate, yesterday.task_done_rate),
        night_finish_rate: buildCard(
          today.night_finish_rate,
          yesterday.night_finish_rate,
        ),
      },
      series: {
        dates: dates.map((date) => formatDate(date)),
        dau: dailyStats.map((item) => item.dau),
        task_done_rate: dailyStats.map((item) => item.task_done_rate),
        night_finish_rate: dailyStats.map((item) => item.night_finish_rate),
      },
    };
  }

  async funnelTodayTasks(dateFrom?: string, dateTo?: string) {
    const { start, end } = buildDateRange(dateFrom, dateTo);

    const openUsers = await this.prisma.dailyTaskSet.count({
      where: { date: { gte: start, lte: end } },
      distinct: ['user_id'],
    });

    const doneUsers = await this.prisma.dailyTaskSet.count({
      where: { date: { gte: start, lte: end }, tasks: { some: { status: 'done' } } },
      distinct: ['user_id'],
    });

    const noteUsers = await this.prisma.microNote.count({
      where: { date: { gte: start, lte: end } },
      distinct: ['user_id'],
    });

    const skipReasons = await this.prisma.dailyTask.groupBy({
      by: ['skip_reason'],
      _count: { _all: true },
      where: {
        status: 'skipped',
        skip_reason: { not: null },
        created_at: { gte: start, lte: end },
      },
      orderBy: { _count: { _all: 'desc' } },
      take: 5,
    });

    return {
      steps: [
        { name: 'open_today', users: openUsers },
        { name: 'view_task_detail', users: openUsers },
        { name: 'done_any_task', users: doneUsers },
        { name: 'add_note', users: noteUsers },
      ],
      skip_reasons_top: skipReasons.map((item) => ({
        reason: item.skip_reason ?? 'unknown',
        count: item._count._all,
      })),
    };
  }

  async funnelNight(dateFrom?: string, dateTo?: string) {
    const { start, end } = buildDateRange(dateFrom, dateTo);

    const entryUsers = await this.prisma.nightSession.count({
      where: { date: { gte: start, lte: end } },
      distinct: ['user_id'],
    });

    const finishUsers = await this.prisma.nightSession.count({
      where: { date: { gte: start, lte: end }, status: 'finished' },
      distinct: ['user_id'],
    });

    const programStats = await this.prisma.nightSession.groupBy({
      by: ['program_id', 'status'],
      _count: { _all: true },
      where: { date: { gte: start, lte: end } },
    });

    const programs = await this.prisma.nightProgram.findMany({
      where: { deleted_at: null },
      select: { id: true, title: true },
    });
    const titleMap = new Map(programs.map((p) => [p.id, p.title]));

    const summary = new Map<
      string,
      { entries: number; finished: number }
    >();
    programStats.forEach((stat) => {
      const current = summary.get(stat.program_id) ?? {
        entries: 0,
        finished: 0,
      };
      current.entries += stat._count._all;
      if (stat.status === 'finished') {
        current.finished += stat._count._all;
      }
      summary.set(stat.program_id, current);
    });

    const ranking = Array.from(summary.entries()).map(([programId, stats]) => {
      const finishRate = stats.entries
        ? stats.finished / stats.entries
        : 0;
      return {
        program_id: programId,
        title: titleMap.get(programId) ?? programId,
        entries: stats.entries,
        finish_rate: finishRate,
      };
    });

    const top = [...ranking]
      .sort((a, b) => b.finish_rate - a.finish_rate)
      .slice(0, 5);
    const bottom = [...ranking]
      .sort((a, b) => a.finish_rate - b.finish_rate)
      .slice(0, 5);

    return {
      steps: [
        { name: 'enter_night', users: entryUsers },
        { name: 'finish_night', users: finishUsers },
      ],
      program_ranking: { top, bottom },
    };
  }

  async rankingTaskTemplates(window: string, metric: string) {
    const days = parseWindowDays(window);
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const templates = await this.prisma.taskTemplate.findMany({
      where: { deleted_at: null },
      select: { id: true, title: true },
    });
    const templateIds = templates.map((item) => item.id);
    if (!templateIds.length) {
      return { top: [], bottom: [] };
    }

    const [totals, done] = await this.prisma.$transaction([
      this.prisma.dailyTask.groupBy({
        by: ['template_id'],
        _count: { _all: true },
        where: { template_id: { in: templateIds }, created_at: { gte: since } },
      }),
      this.prisma.dailyTask.groupBy({
        by: ['template_id'],
        _count: { _all: true },
        where: {
          template_id: { in: templateIds },
          created_at: { gte: since },
          status: 'done',
        },
      }),
    ]);

    const totalMap = new Map<string, number>();
    totals.forEach((item) => totalMap.set(item.template_id, item._count._all));
    const doneMap = new Map<string, number>();
    done.forEach((item) => doneMap.set(item.template_id, item._count._all));

    const rows = templates.map((template) => {
      const impressions = totalMap.get(template.id) ?? 0;
      const doneCount = doneMap.get(template.id) ?? 0;
      const doneRate = impressions ? doneCount / impressions : 0;
      return {
        template_id: template.id,
        title: template.title,
        impressions,
        done_rate: doneRate,
      };
    });

    const sorted = metric === 'done_rate'
      ? [...rows].sort((a, b) => b.done_rate - a.done_rate)
      : [...rows].sort((a, b) => b.impressions - a.impressions);

    return {
      top: sorted.slice(0, 10),
      bottom: sorted.slice(-10).reverse(),
    };
  }

  private async computeDailyStats(date: Date) {
    const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const end = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);

    const [dau, newUsers, doneUsers, entryUsers, finishUsers] =
      await this.prisma.$transaction([
        this.prisma.dailyTaskSet.count({
          where: { date: { gte: start, lt: end } },
          distinct: ['user_id'],
        }),
        this.prisma.user.count({
          where: { created_at: { gte: start, lt: end } },
        }),
        this.prisma.dailyTaskSet.count({
          where: {
            date: { gte: start, lt: end },
            tasks: { some: { status: 'done' } },
          },
          distinct: ['user_id'],
        }),
        this.prisma.nightSession.count({
          where: { date: { gte: start, lt: end } },
          distinct: ['user_id'],
        }),
        this.prisma.nightSession.count({
          where: { date: { gte: start, lt: end }, status: 'finished' },
          distinct: ['user_id'],
        }),
      ]);

    const taskDoneRate = dau ? doneUsers / dau : 0;
    const nightFinishRate = entryUsers ? finishUsers / entryUsers : 0;

    return {
      dau,
      new_users: newUsers,
      task_done_rate: taskDoneRate,
      night_finish_rate: nightFinishRate,
    };
  }
}

function buildDateRange(dateFrom?: string, dateTo?: string) {
  const today = startOfDay(new Date());
  const end = dateTo ? startOfDay(new Date(dateTo)) : today;
  let start = dateFrom ? startOfDay(new Date(dateFrom)) : addDays(end, -6);
  if (start > end) {
    start = end;
  }

  const dates: Date[] = [];
  let cursor = new Date(start);
  while (cursor <= end) {
    dates.push(new Date(cursor));
    cursor = addDays(cursor, 1);
  }

  return { start, end, dates };
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function formatDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function emptyDaily() {
  return { dau: 0, new_users: 0, task_done_rate: 0, night_finish_rate: 0 };
}

function buildCard(today: number, yesterday: number) {
  const delta = yesterday === 0 ? 0 : (today - yesterday) / yesterday;
  return { today, yesterday, delta };
}

function parseWindowDays(window?: string) {
  if (!window) {
    return 7;
  }
  const match = window.match(/^(\d+)d$/);
  if (match) {
    return Number(match[1]);
  }
  return 7;
}
