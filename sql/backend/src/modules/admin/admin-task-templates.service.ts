import { HttpStatus, Injectable } from '@nestjs/common';
import { Prisma, TaskTemplate } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { BusinessException } from '../../common/exceptions/business.exception';
import { AppErrorCode } from '../../common/exceptions/app-error-code';
import { AdminAuditService } from './admin-audit.service';

type TemplatePerf = {
  impressions: number;
  done_rate: number;
  skip_rate: number;
  replaced_rate: number;
};

@Injectable()
export class AdminTaskTemplatesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AdminAuditService,
  ) {}

  async list(params: {
    q?: string;
    isActive?: boolean;
    type?: string;
    difficulty?: number;
    moods?: string[];
    directionTags?: string[];
    traceTags?: string[];
    updatedFrom?: Date;
    updatedTo?: Date;
    sort?: string;
    page: number;
    pageSize: number;
  }) {
    const where: Prisma.TaskTemplateWhereInput = {
      deleted_at: null,
      ...(params.q
        ? {
            OR: [
              { id: { contains: params.q } },
              { title: { contains: params.q } },
            ],
          }
        : {}),
      ...(params.isActive !== undefined ? { is_active: params.isActive } : {}),
      ...(params.type ? { type: params.type } : {}),
      ...(params.difficulty ? { difficulty: params.difficulty } : {}),
      ...(params.updatedFrom || params.updatedTo
        ? {
            updated_at: {
              ...(params.updatedFrom ? { gte: params.updatedFrom } : {}),
              ...(params.updatedTo ? { lte: params.updatedTo } : {}),
            },
          }
        : {}),
      ...(params.moods && params.moods.length
        ? { moods: { array_contains: params.moods } }
        : {}),
      ...(params.directionTags && params.directionTags.length
        ? { direction_tags: { array_contains: params.directionTags } }
        : {}),
      ...(params.traceTags && params.traceTags.length
        ? { trace_tags: { array_contains: params.traceTags } }
        : {}),
    };

    if (params.sort === 'perf_done_rate_desc') {
      const all = await this.prisma.taskTemplate.findMany({
        where,
        include: { updated_by_admin: true },
        orderBy: { updated_at: 'desc' },
      });

      const perfMap = await this.buildPerformanceMap(all.map((item) => item.id));
      const sorted = [...all].sort((a, b) => {
        const perfA = perfMap[a.id] ?? emptyPerf();
        const perfB = perfMap[b.id] ?? emptyPerf();
        return perfB.done_rate - perfA.done_rate;
      });

      const start = (params.page - 1) * params.pageSize;
      const items = sorted.slice(start, start + params.pageSize).map((item) =>
        this.mapListItem(item, perfMap[item.id]),
      );

      return {
        items,
        page: params.page,
        page_size: params.pageSize,
        total: all.length,
      };
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.taskTemplate.findMany({
        where,
        include: { updated_by_admin: true },
        orderBy: { updated_at: 'desc' },
        skip: (params.page - 1) * params.pageSize,
        take: params.pageSize,
      }),
      this.prisma.taskTemplate.count({ where }),
    ]);

    const perfMap = await this.buildPerformanceMap(items.map((item) => item.id));

    return {
      items: items.map((item) => this.mapListItem(item, perfMap[item.id])),
      page: params.page,
      page_size: params.pageSize,
      total,
    };
  }

  async create(params: {
    title: string;
    description?: string | null;
    type: string;
    difficulty: number;
    defaultDurationSec?: number | null;
    steps?: unknown[];
    moods?: string[];
    directionTags?: string[];
    traceTags?: string[];
    isActive?: boolean;
    adminId: string;
    ip?: string | null;
    userAgent?: string | null;
  }) {
    const template = await this.prisma.taskTemplate.create({
      data: {
        title: params.title,
        description: params.description ?? '',
        type: params.type,
        difficulty: params.difficulty,
        default_duration_sec: params.defaultDurationSec ?? null,
        steps_json: params.steps ?? Prisma.JsonNull,
        moods: params.moods ?? Prisma.JsonNull,
        direction_tags: params.directionTags ?? Prisma.JsonNull,
        trace_tags: params.traceTags ?? Prisma.JsonNull,
        is_active: params.isActive ?? false,
        updated_by_admin_id: params.adminId,
        content_version: 1,
      },
    });

    await this.auditService.createLog({
      actorAdminId: params.adminId,
      action: 'create',
      resourceType: 'task_template',
      resourceId: template.id,
      diff: { created: { title: template.title } },
      ip: params.ip,
      userAgent: params.userAgent,
    });

    return { id: template.id, is_active: template.is_active };
  }

  async getById(id: string) {
    const template = await this.prisma.taskTemplate.findFirst({
      where: { id, deleted_at: null },
    });

    if (!template) {
      throw new BusinessException(
        AppErrorCode.TASK_TEMPLATE_NOT_FOUND,
        'Task template not found',
        HttpStatus.NOT_FOUND,
      );
    }

    const perf = await this.buildTemplateDetailPerf(id);

    return {
      template: this.mapTemplate(template),
      perf,
    };
  }

  async update(
    id: string,
    params: {
      title?: string;
      description?: string | null;
      type?: string;
      difficulty?: number;
      defaultDurationSec?: number | null;
      steps?: unknown[] | null;
      moods?: string[] | null;
      directionTags?: string[] | null;
      traceTags?: string[] | null;
      adminId: string;
      ip?: string | null;
      userAgent?: string | null;
    },
  ) {
    const existing = await this.prisma.taskTemplate.findFirst({
      where: { id, deleted_at: null },
    });

    if (!existing) {
      throw new BusinessException(
        AppErrorCode.TASK_TEMPLATE_NOT_FOUND,
        'Task template not found',
        HttpStatus.NOT_FOUND,
      );
    }

    const updated = await this.prisma.taskTemplate.update({
      where: { id },
      data: {
        ...(params.title !== undefined ? { title: params.title } : {}),
        ...(params.description !== undefined
          ? { description: params.description ?? '' }
          : {}),
        ...(params.type !== undefined ? { type: params.type } : {}),
        ...(params.difficulty !== undefined
          ? { difficulty: params.difficulty }
          : {}),
        ...(params.defaultDurationSec !== undefined
          ? { default_duration_sec: params.defaultDurationSec ?? null }
          : {}),
        ...(params.steps !== undefined
          ? { steps_json: params.steps ?? Prisma.JsonNull }
          : {}),
        ...(params.moods !== undefined
          ? { moods: params.moods ?? Prisma.JsonNull }
          : {}),
        ...(params.directionTags !== undefined
          ? { direction_tags: params.directionTags ?? Prisma.JsonNull }
          : {}),
        ...(params.traceTags !== undefined
          ? { trace_tags: params.traceTags ?? Prisma.JsonNull }
          : {}),
        updated_by_admin_id: params.adminId,
      },
    });

    await this.auditService.createLog({
      actorAdminId: params.adminId,
      action: 'update',
      resourceType: 'task_template',
      resourceId: id,
      diff: buildDiff(existing, updated, [
        'title',
        'description',
        'type',
        'difficulty',
        'default_duration_sec',
        'steps_json',
        'moods',
        'direction_tags',
        'trace_tags',
      ]),
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
    const existing = await this.prisma.taskTemplate.findFirst({
      where: { id, deleted_at: null },
    });

    if (!existing) {
      throw new BusinessException(
        AppErrorCode.TASK_TEMPLATE_NOT_FOUND,
        'Task template not found',
        HttpStatus.NOT_FOUND,
      );
    }

    const updated = await this.prisma.taskTemplate.update({
      where: { id },
      data: { is_active: isActive, updated_by_admin_id: params.adminId },
    });

    await this.auditService.createLog({
      actorAdminId: params.adminId,
      action: isActive ? 'activate' : 'deactivate',
      resourceType: 'task_template',
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
    const existing = await this.prisma.taskTemplate.findFirst({
      where: { id, deleted_at: null },
    });

    if (!existing) {
      throw new BusinessException(
        AppErrorCode.TASK_TEMPLATE_NOT_FOUND,
        'Task template not found',
        HttpStatus.NOT_FOUND,
      );
    }

    const duplicated = await this.prisma.taskTemplate.create({
      data: {
        title: `${existing.title}${titleSuffix ?? ''}`,
        description: existing.description,
        type: existing.type,
        difficulty: existing.difficulty,
        default_duration_sec: existing.default_duration_sec,
        steps_json: existing.steps_json ?? Prisma.JsonNull,
        moods: existing.moods ?? Prisma.JsonNull,
        direction_tags: existing.direction_tags ?? Prisma.JsonNull,
        trace_tags: existing.trace_tags ?? Prisma.JsonNull,
        is_active: false,
        updated_by_admin_id: params.adminId,
        content_version: existing.content_version ?? 1,
      },
    });

    await this.auditService.createLog({
      actorAdminId: params.adminId,
      action: 'create',
      resourceType: 'task_template',
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
    const existing = await this.prisma.taskTemplate.findFirst({
      where: { id, deleted_at: null },
    });

    if (!existing) {
      throw new BusinessException(
        AppErrorCode.TASK_TEMPLATE_NOT_FOUND,
        'Task template not found',
        HttpStatus.NOT_FOUND,
      );
    }

    await this.prisma.taskTemplate.update({
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
      resourceType: 'task_template',
      resourceId: id,
      diff: { deleted_at: { before: existing.deleted_at, after: new Date() } },
      ip: params.ip,
      userAgent: params.userAgent,
    });

    return { deleted: true };
  }

  async previewImport(params: {
    format: string;
    fileUrl?: string | null;
    defaultActive?: boolean;
    adminId: string;
    ip?: string | null;
    userAgent?: string | null;
  }) {
    if (!params.fileUrl) {
      throw new BusinessException(
        AppErrorCode.INVALID_REQUEST,
        'file_url is required',
        HttpStatus.BAD_REQUEST,
      );
    }

    const parsed = await this.parseImport(params.format, params.fileUrl);
    const preview = {
      total_rows: parsed.rows.length,
      valid_rows: parsed.validRows.length,
      invalid_rows: parsed.errors.length,
    };

    const record = await this.prisma.taskTemplateImport.create({
      data: {
        format: params.format,
        source_url: params.fileUrl,
        default_active: params.defaultActive ?? false,
        preview_json: preview,
        data_json: parsed.validRows,
        errors_json: parsed.errors,
        status: 'preview',
      },
    });

    await this.auditService.createLog({
      actorAdminId: params.adminId,
      action: 'create',
      resourceType: 'task_template_import',
      resourceId: record.id,
      diff: { preview },
      ip: params.ip,
      userAgent: params.userAgent,
    });

    return {
      import_id: record.id,
      preview,
      errors: parsed.errors,
    };
  }

  async commitImport(params: {
    importId: string;
    adminId: string;
    ip?: string | null;
    userAgent?: string | null;
  }) {
    const record = await this.prisma.taskTemplateImport.findUnique({
      where: { id: params.importId },
    });

    if (!record) {
      throw new BusinessException(
        AppErrorCode.INVALID_REQUEST,
        'Import not found',
        HttpStatus.NOT_FOUND,
      );
    }

    if (record.status !== 'preview') {
      return { created: 0, skipped: 0 };
    }

    const rows = Array.isArray(record.data_json) ? record.data_json : [];
    let created = 0;
    let skipped = 0;

    for (const row of rows as Array<Record<string, unknown>>) {
      const title = typeof row.title === 'string' ? row.title.trim() : '';
      if (!title) {
        skipped += 1;
        continue;
      }

      await this.prisma.taskTemplate.create({
        data: {
          title,
          description:
            typeof row.description === 'string' ? row.description : '',
          type: typeof row.type === 'string' ? row.type : 'free',
          difficulty: typeof row.difficulty === 'number' ? row.difficulty : 1,
          default_duration_sec:
            typeof row.default_duration_sec === 'number'
              ? row.default_duration_sec
              : null,
          steps_json: Array.isArray(row.steps)
            ? row.steps
            : Prisma.JsonNull,
          moods: Array.isArray(row.moods) ? row.moods : Prisma.JsonNull,
          direction_tags: Array.isArray(row.direction_tags)
            ? row.direction_tags
            : Prisma.JsonNull,
          trace_tags: Array.isArray(row.trace_tags)
            ? row.trace_tags
            : Prisma.JsonNull,
          is_active: record.default_active,
          updated_by_admin_id: params.adminId,
          content_version: 1,
        },
      });

      created += 1;
    }

    await this.prisma.taskTemplateImport.update({
      where: { id: record.id },
      data: { status: 'committed' },
    });

    await this.auditService.createLog({
      actorAdminId: params.adminId,
      action: 'publish',
      resourceType: 'task_template_import',
      resourceId: record.id,
      diff: { created, skipped },
      ip: params.ip,
      userAgent: params.userAgent,
    });

    return { created, skipped };
  }

  private mapListItem(
    item: TaskTemplate & { updated_by_admin?: { id: string; name: string } | null },
    perf: TemplatePerf | undefined,
  ) {
    return {
      id: item.id,
      title: item.title,
      type: item.type,
      difficulty: item.difficulty,
      is_active: item.is_active,
      default_duration_sec: item.default_duration_sec,
      moods: parseStringArray(item.moods),
      direction_tags: parseStringArray(item.direction_tags),
      trace_tags: parseStringArray(item.trace_tags),
      updated_at: item.updated_at,
      updated_by: item.updated_by_admin
        ? { id: item.updated_by_admin.id, name: item.updated_by_admin.name }
        : null,
      perf_7d: perf ?? emptyPerf(),
    };
  }

  private mapTemplate(item: TaskTemplate) {
    return {
      id: item.id,
      title: item.title,
      description: item.description,
      type: item.type,
      difficulty: item.difficulty,
      default_duration_sec: item.default_duration_sec,
      steps: Array.isArray(item.steps_json) ? item.steps_json : [],
      moods: parseStringArray(item.moods),
      direction_tags: parseStringArray(item.direction_tags),
      trace_tags: parseStringArray(item.trace_tags),
      is_active: item.is_active,
      updated_at: item.updated_at,
    };
  }

  private async buildPerformanceMap(templateIds: string[]) {
    if (!templateIds.length) {
      return {} as Record<string, TemplatePerf>;
    }

    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [totals, statuses, replaced] = await this.prisma.$transaction([
      this.prisma.dailyTask.groupBy({
        by: ['template_id'],
        _count: { _all: true },
        where: {
          template_id: { in: templateIds },
          created_at: { gte: since },
        },
      }),
      this.prisma.dailyTask.groupBy({
        by: ['template_id', 'status'],
        _count: { _all: true },
        where: {
          template_id: { in: templateIds },
          created_at: { gte: since },
        },
      }),
      this.prisma.dailyTask.groupBy({
        by: ['template_id'],
        _count: { _all: true },
        where: {
          template_id: { in: templateIds },
          created_at: { gte: since },
          replaced_from_task_id: { not: null },
        },
      }),
    ]);

    const totalMap = new Map<string, number>();
    totals.forEach((item) => totalMap.set(item.template_id, item._count._all));

    const statusMap = new Map<string, Record<string, number>>();
    statuses.forEach((item) => {
      const current = statusMap.get(item.template_id) ?? {};
      current[item.status] = item._count._all;
      statusMap.set(item.template_id, current);
    });

    const replacedMap = new Map<string, number>();
    replaced.forEach((item) =>
      replacedMap.set(item.template_id, item._count._all),
    );

    const perfMap: Record<string, TemplatePerf> = {};
    templateIds.forEach((id) => {
      const impressions = totalMap.get(id) ?? 0;
      const statusCounts = statusMap.get(id) ?? {};
      const done = statusCounts.done ?? 0;
      const skipped = statusCounts.skipped ?? 0;
      const replacedCount = replacedMap.get(id) ?? 0;
      perfMap[id] = {
        impressions,
        done_rate: impressions ? done / impressions : 0,
        skip_rate: impressions ? skipped / impressions : 0,
        replaced_rate: impressions ? replacedCount / impressions : 0,
      };
    });

    return perfMap;
  }

  private async buildTemplateDetailPerf(id: string) {
    const perfMap = await this.buildPerformanceMap([id]);
    const perf = perfMap[id] ?? emptyPerf();
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const skipReasons = await this.prisma.dailyTask.groupBy({
      by: ['skip_reason'],
      _count: { _all: true },
      where: {
        template_id: id,
        created_at: { gte: since },
        status: 'skipped',
        skip_reason: { not: null },
      },
      orderBy: { _count: { _all: 'desc' } },
      take: 5,
    });

    return {
      last_7d: perf,
      skip_reasons_top: skipReasons.map((item) => ({
        reason: item.skip_reason ?? 'unknown',
        count: item._count._all,
      })),
      replace_reasons_top: [],
    };
  }

  private async parseImport(format: string, fileUrl: string) {
    if (format !== 'json' && format !== 'csv') {
      throw new BusinessException(
        AppErrorCode.INVALID_REQUEST,
        'Unsupported import format',
        HttpStatus.BAD_REQUEST,
      );
    }
    const response = await fetch(fileUrl);
    if (!response.ok) {
      throw new BusinessException(
        AppErrorCode.INVALID_REQUEST,
        'Failed to fetch import file',
        HttpStatus.BAD_REQUEST,
      );
    }

    const text = await response.text();
    const rows: Array<Record<string, unknown>> =
      format === 'json' ? parseJsonRows(text) : parseCsvRows(text);

    const errors: Array<{ row: number; field: string; message: string }> = [];
    const validRows: Array<Record<string, unknown>> = [];

    rows.forEach((row, index) => {
      const issues = validateImportRow(row);
      if (issues.length) {
        issues.forEach((issue) =>
          errors.push({
            row: index + 1,
            field: issue.field,
            message: issue.message,
          }),
        );
      } else {
        validRows.push(row);
      }
    });

    return { rows, validRows, errors };
  }
}

function parseStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((item): item is string => typeof item === 'string');
}

function emptyPerf(): TemplatePerf {
  return { impressions: 0, done_rate: 0, skip_rate: 0, replaced_rate: 0 };
}

function buildDiff(
  before: TaskTemplate,
  after: TaskTemplate,
  fields: Array<keyof TaskTemplate>,
) {
  const diff: Record<string, { before: unknown; after: unknown }> = {};
  fields.forEach((field) => {
    if (before[field] !== after[field]) {
      diff[field] = { before: before[field], after: after[field] };
    }
  });
  return diff;
}

function parseJsonRows(text: string) {
  const parsed = JSON.parse(text);
  if (!Array.isArray(parsed)) {
    throw new BusinessException(
      AppErrorCode.INVALID_REQUEST,
      'Import JSON must be an array',
      HttpStatus.BAD_REQUEST,
    );
  }
  return (parsed as Array<Record<string, unknown>>).map((row) =>
    normalizeImportRow(row),
  );
}

function parseCsvRows(text: string) {
  const lines = text.split(/\r?\n/).filter((line) => line.trim().length);
  if (!lines.length) {
    return [];
  }
  const headers = lines[0].split(',').map((item) => item.trim());
  const rows: Array<Record<string, unknown>> = [];
  for (let i = 1; i < lines.length; i += 1) {
    const values = lines[i].split(',').map((item) => item.trim());
    const row: Record<string, unknown> = {};
    headers.forEach((header, index) => {
      row[header] = values[index];
    });
    rows.push(normalizeImportRow(row));
  }
  return rows;
}

function normalizeImportRow(row: Record<string, unknown>) {
  const normalized: Record<string, unknown> = { ...row };
  ['moods', 'direction_tags', 'trace_tags'].forEach((key) => {
    if (typeof normalized[key] === 'string') {
      const raw = normalized[key] as string;
      normalized[key] = raw
        ? raw.split('|').map((item) => item.trim()).filter(Boolean)
        : [];
    }
  });
  if (typeof normalized.steps === 'string') {
    const raw = normalized.steps as string;
    try {
      normalized.steps = JSON.parse(raw);
    } catch {
      normalized.steps = [];
    }
  }
  if (typeof normalized.difficulty === 'string') {
    const value = Number(normalized.difficulty);
    normalized.difficulty = Number.isNaN(value) ? 1 : value;
  }
  if (typeof normalized.default_duration_sec === 'string') {
    const value = Number(normalized.default_duration_sec);
    normalized.default_duration_sec = Number.isNaN(value) ? null : value;
  }
  return normalized;
}

function validateImportRow(row: Record<string, unknown>) {
  const issues: Array<{ field: string; message: string }> = [];
  const title = typeof row.title === 'string' ? row.title.trim() : '';
  if (!title) {
    issues.push({ field: 'title', message: 'empty' });
  }
  return issues;
}
