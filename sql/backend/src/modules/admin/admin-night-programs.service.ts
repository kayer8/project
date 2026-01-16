import { HttpStatus, Injectable } from '@nestjs/common';
import { NightProgram, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { BusinessException } from '../../common/exceptions/business.exception';
import { AppErrorCode } from '../../common/exceptions/app-error-code';
import { AdminAuditService } from './admin-audit.service';

type NightPerf = {
  entries: number;
  finish_rate: number;
  abandon_rate: number;
};

@Injectable()
export class AdminNightProgramsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AdminAuditService,
  ) {}

  async list(params: {
    q?: string;
    type?: string;
    isActive?: boolean;
    sort?: string;
    page: number;
    pageSize: number;
  }) {
    const where: Prisma.NightProgramWhereInput = {
      deleted_at: null,
      ...(params.q
        ? {
            OR: [
              { id: { contains: params.q } },
              { title: { contains: params.q } },
            ],
          }
        : {}),
      ...(params.type ? { type: params.type } : {}),
      ...(params.isActive !== undefined ? { is_active: params.isActive } : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.nightProgram.findMany({
        where,
        orderBy: { updated_at: 'desc' },
        skip: (params.page - 1) * params.pageSize,
        take: params.pageSize,
      }),
      this.prisma.nightProgram.count({ where }),
    ]);

    const perfMap = await this.buildPerfMap(items.map((item) => item.id));

    return {
      items: items.map((item) => ({
        id: item.id,
        title: item.title,
        type: item.type,
        is_active: item.is_active,
        updated_at: item.updated_at,
        perf_7d: perfMap[item.id] ?? emptyPerf(),
      })),
      page: params.page,
      page_size: params.pageSize,
      total,
    };
  }

  async create(params: {
    title: string;
    type: string;
    durationSec?: number | null;
    content?: Record<string, unknown> | null;
    moods?: string[];
    directionTags?: string[];
    isActive?: boolean;
    adminId: string;
    ip?: string | null;
    userAgent?: string | null;
  }) {
    const program = await this.prisma.nightProgram.create({
      data: {
        title: params.title,
        type: params.type,
        duration_sec: params.durationSec ?? null,
        content_json: params.content ?? Prisma.JsonNull,
        moods: params.moods ?? Prisma.JsonNull,
        direction_tags: params.directionTags ?? Prisma.JsonNull,
        is_active: params.isActive ?? false,
        updated_by_admin_id: params.adminId,
      },
    });

    await this.auditService.createLog({
      actorAdminId: params.adminId,
      action: 'create',
      resourceType: 'night_program',
      resourceId: program.id,
      diff: { created: { title: program.title } },
      ip: params.ip,
      userAgent: params.userAgent,
    });

    return { id: program.id };
  }

  async getById(id: string) {
    const program = await this.prisma.nightProgram.findFirst({
      where: { id, deleted_at: null },
    });

    if (!program) {
      throw new BusinessException(
        AppErrorCode.NIGHT_PROGRAM_NOT_FOUND,
        'Night program not found',
        HttpStatus.NOT_FOUND,
      );
    }

    const perf = await this.buildDetailPerf(program.id);

    return {
      program: {
        id: program.id,
        title: program.title,
        type: program.type,
        duration_sec: program.duration_sec ?? null,
        content: program.content_json ?? {},
        moods: parseStringArray(program.moods),
        direction_tags: parseStringArray(program.direction_tags),
        is_active: program.is_active,
      },
      perf,
    };
  }

  async update(
    id: string,
    params: {
      title?: string;
      type?: string;
      durationSec?: number | null;
      content?: Record<string, unknown> | null;
      moods?: string[] | null;
      directionTags?: string[] | null;
      isActive?: boolean;
      adminId: string;
      ip?: string | null;
      userAgent?: string | null;
    },
  ) {
    const existing = await this.prisma.nightProgram.findFirst({
      where: { id, deleted_at: null },
    });

    if (!existing) {
      throw new BusinessException(
        AppErrorCode.NIGHT_PROGRAM_NOT_FOUND,
        'Night program not found',
        HttpStatus.NOT_FOUND,
      );
    }

    const updated = await this.prisma.nightProgram.update({
      where: { id },
      data: {
        ...(params.title !== undefined ? { title: params.title } : {}),
        ...(params.type !== undefined ? { type: params.type } : {}),
        ...(params.durationSec !== undefined
          ? { duration_sec: params.durationSec ?? null }
          : {}),
        ...(params.content !== undefined
          ? { content_json: params.content ?? Prisma.JsonNull }
          : {}),
        ...(params.moods !== undefined
          ? { moods: params.moods ?? Prisma.JsonNull }
          : {}),
        ...(params.directionTags !== undefined
          ? { direction_tags: params.directionTags ?? Prisma.JsonNull }
          : {}),
        ...(params.isActive !== undefined
          ? { is_active: params.isActive }
          : {}),
        updated_by_admin_id: params.adminId,
      },
    });

    await this.auditService.createLog({
      actorAdminId: params.adminId,
      action: 'update',
      resourceType: 'night_program',
      resourceId: id,
      diff: buildDiff(existing, updated),
      ip: params.ip,
      userAgent: params.userAgent,
    });

    return { updated: true };
  }

  async setActive(
    id: string,
    isActive: boolean,
    params: { adminId: string; ip?: string | null; userAgent?: string | null },
  ) {
    const existing = await this.prisma.nightProgram.findFirst({
      where: { id, deleted_at: null },
    });

    if (!existing) {
      throw new BusinessException(
        AppErrorCode.NIGHT_PROGRAM_NOT_FOUND,
        'Night program not found',
        HttpStatus.NOT_FOUND,
      );
    }

    const updated = await this.prisma.nightProgram.update({
      where: { id },
      data: { is_active: isActive, updated_by_admin_id: params.adminId },
    });

    await this.auditService.createLog({
      actorAdminId: params.adminId,
      action: isActive ? 'activate' : 'deactivate',
      resourceType: 'night_program',
      resourceId: id,
      diff: { is_active: { before: existing.is_active, after: updated.is_active } },
      ip: params.ip,
      userAgent: params.userAgent,
    });

    return { id: updated.id, is_active: updated.is_active };
  }

  async duplicate(
    id: string,
    titleSuffix: string | undefined,
    params: { adminId: string; ip?: string | null; userAgent?: string | null },
  ) {
    const existing = await this.prisma.nightProgram.findFirst({
      where: { id, deleted_at: null },
    });

    if (!existing) {
      throw new BusinessException(
        AppErrorCode.NIGHT_PROGRAM_NOT_FOUND,
        'Night program not found',
        HttpStatus.NOT_FOUND,
      );
    }

    const duplicated = await this.prisma.nightProgram.create({
      data: {
        title: `${existing.title}${titleSuffix ?? ''}`,
        type: existing.type,
        duration_sec: existing.duration_sec,
        content_json: existing.content_json ?? Prisma.JsonNull,
        moods: existing.moods ?? Prisma.JsonNull,
        direction_tags: existing.direction_tags ?? Prisma.JsonNull,
        is_active: false,
        updated_by_admin_id: params.adminId,
      },
    });

    await this.auditService.createLog({
      actorAdminId: params.adminId,
      action: 'create',
      resourceType: 'night_program',
      resourceId: duplicated.id,
      diff: { duplicated_from: existing.id },
      ip: params.ip,
      userAgent: params.userAgent,
    });

    return { new_id: duplicated.id, is_active: duplicated.is_active };
  }

  async remove(
    id: string,
    params: { adminId: string; ip?: string | null; userAgent?: string | null },
  ) {
    const existing = await this.prisma.nightProgram.findFirst({
      where: { id, deleted_at: null },
    });

    if (!existing) {
      throw new BusinessException(
        AppErrorCode.NIGHT_PROGRAM_NOT_FOUND,
        'Night program not found',
        HttpStatus.NOT_FOUND,
      );
    }

    await this.prisma.nightProgram.update({
      where: { id },
      data: {
        deleted_at: new Date(),
        is_active: false,
        updated_by_admin_id: params.adminId,
      },
    });

    await this.auditService.createLog({
      actorAdminId: params.adminId,
      action: 'delete',
      resourceType: 'night_program',
      resourceId: id,
      diff: { deleted_at: { before: existing.deleted_at, after: new Date() } },
      ip: params.ip,
      userAgent: params.userAgent,
    });

    return { deleted: true };
  }

  private async buildPerfMap(programIds: string[]) {
    if (!programIds.length) {
      return {} as Record<string, NightPerf>;
    }
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const [entries, finished] = await this.prisma.$transaction([
      this.prisma.nightSession.groupBy({
        by: ['program_id'],
        _count: { _all: true },
        where: { program_id: { in: programIds }, started_at: { gte: since } },
      }),
      this.prisma.nightSession.groupBy({
        by: ['program_id'],
        _count: { _all: true },
        where: {
          program_id: { in: programIds },
          started_at: { gte: since },
          status: 'finished',
        },
      }),
    ]);

    const entryMap = new Map<string, number>();
    entries.forEach((item) => entryMap.set(item.program_id, item._count._all));
    const finishMap = new Map<string, number>();
    finished.forEach((item) =>
      finishMap.set(item.program_id, item._count._all),
    );

    const perfMap: Record<string, NightPerf> = {};
    programIds.forEach((id) => {
      const entryCount = entryMap.get(id) ?? 0;
      const finishCount = finishMap.get(id) ?? 0;
      perfMap[id] = {
        entries: entryCount,
        finish_rate: entryCount ? finishCount / entryCount : 0,
        abandon_rate: entryCount ? (entryCount - finishCount) / entryCount : 0,
      };
    });

    return perfMap;
  }

  private async buildDetailPerf(programId: string) {
    const perfMap = await this.buildPerfMap([programId]);
    const perf = perfMap[programId] ?? emptyPerf();
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const sessions = await this.prisma.nightSession.findMany({
      where: { program_id: programId, started_at: { gte: since } },
      select: { answers_json: true },
    });

    const stats: Record<string, { yes: number; no: number; skip: number }> = {};
    for (const session of sessions) {
      if (!Array.isArray(session.answers_json)) {
        continue;
      }
      (session.answers_json as Array<Record<string, unknown>>).forEach(
        (answer) => {
          const qid = typeof answer.qid === 'string' ? answer.qid : null;
          const value = typeof answer.answer === 'string' ? answer.answer : null;
          if (!qid || !value) {
            return;
          }
          const current = stats[qid] ?? { yes: 0, no: 0, skip: 0 };
          if (value in current) {
            current[value as 'yes' | 'no' | 'skip'] += 1;
          }
          stats[qid] = current;
        },
      );
    }

    return {
      last_7d: perf,
      question_stats: Object.entries(stats).map(([qid, values]) => ({
        qid,
        yes: values.yes,
        no: values.no,
        skip: values.skip,
      })),
    };
  }
}

function emptyPerf(): NightPerf {
  return { entries: 0, finish_rate: 0, abandon_rate: 0 };
}

function parseStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((item): item is string => typeof item === 'string');
}

function buildDiff(before: NightProgram, after: NightProgram) {
  const fields: Array<keyof NightProgram> = [
    'title',
    'type',
    'duration_sec',
    'content_json',
    'moods',
    'direction_tags',
    'is_active',
  ];
  const diff: Record<string, { before: unknown; after: unknown }> = {};
  fields.forEach((field) => {
    if (before[field] !== after[field]) {
      diff[field] = { before: before[field], after: after[field] };
    }
  });
  return diff;
}
