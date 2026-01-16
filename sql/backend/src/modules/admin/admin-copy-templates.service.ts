import { HttpStatus, Injectable } from '@nestjs/common';
import { CopyTemplate, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { BusinessException } from '../../common/exceptions/business.exception';
import { AppErrorCode } from '../../common/exceptions/app-error-code';
import { AdminAuditService } from './admin-audit.service';

@Injectable()
export class AdminCopyTemplatesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AdminAuditService,
  ) {}

  async list(params: {
    type?: string;
    isEnabled?: boolean;
    traceTag?: string;
    mood?: string;
    directionId?: string;
    q?: string;
    page: number;
    pageSize: number;
  }) {
    const where: Prisma.CopyTemplateWhereInput = {
      deleted_at: null,
      ...(params.type ? { type: params.type } : {}),
      ...(params.isEnabled !== undefined ? { is_enabled: params.isEnabled } : {}),
      ...(params.q
        ? {
            OR: [
              { id: { contains: params.q } },
              { text: { contains: params.q } },
            ],
          }
        : {}),
    };

    const hasConditionFilters =
      Boolean(params.traceTag) ||
      Boolean(params.mood) ||
      Boolean(params.directionId);

    if (hasConditionFilters) {
      const all = await this.prisma.copyTemplate.findMany({
        where,
        orderBy: { updated_at: 'desc' },
      });

      const filtered = all.filter((item) =>
        matchConditions(item.conditions_json, {
          trace_tag: params.traceTag,
          mood: params.mood,
          direction_id: params.directionId,
        }),
      );

      const start = (params.page - 1) * params.pageSize;
      const pageItems = filtered.slice(start, start + params.pageSize);

      return {
        items: pageItems.map((item) => ({
          id: item.id,
          type: item.type,
          text: item.text,
          conditions: normalizeConditions(item.conditions_json),
          weight: item.weight,
          is_enabled: item.is_enabled,
          hits_7d: 0,
          updated_at: item.updated_at,
        })),
        page: params.page,
        page_size: params.pageSize,
        total: filtered.length,
      };
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.copyTemplate.findMany({
        where,
        orderBy: { updated_at: 'desc' },
        skip: (params.page - 1) * params.pageSize,
        take: params.pageSize,
      }),
      this.prisma.copyTemplate.count({ where }),
    ]);

    return {
      items: items.map((item) => ({
        id: item.id,
        type: item.type,
        text: item.text,
        conditions: normalizeConditions(item.conditions_json),
        weight: item.weight,
        is_enabled: item.is_enabled,
        hits_7d: 0,
        updated_at: item.updated_at,
      })),
      page: params.page,
      page_size: params.pageSize,
      total,
    };
  }

  async create(params: {
    type: string;
    text: string;
    conditions?: Record<string, unknown> | null;
    weight?: number;
    isEnabled?: boolean;
    adminId: string;
    ip?: string | null;
    userAgent?: string | null;
  }) {
    const template = await this.prisma.copyTemplate.create({
      data: {
        type: params.type,
        text: params.text,
        conditions_json: params.conditions ?? Prisma.JsonNull,
        weight: params.weight ?? 1,
        is_enabled: params.isEnabled ?? true,
        updated_by_admin_id: params.adminId,
      },
    });

    await this.auditService.createLog({
      actorAdminId: params.adminId,
      action: 'create',
      resourceType: 'copy_template',
      resourceId: template.id,
      diff: { created: { text: template.text } },
      ip: params.ip,
      userAgent: params.userAgent,
    });

    return { id: template.id };
  }

  async update(
    id: string,
    params: {
      type?: string;
      text?: string;
      conditions?: Record<string, unknown> | null;
      weight?: number;
      isEnabled?: boolean;
      adminId: string;
      ip?: string | null;
      userAgent?: string | null;
    },
  ) {
    const existing = await this.prisma.copyTemplate.findFirst({
      where: { id, deleted_at: null },
    });

    if (!existing) {
      throw new BusinessException(
        AppErrorCode.COPY_TEMPLATE_NOT_FOUND,
        'Copy template not found',
        HttpStatus.NOT_FOUND,
      );
    }

    const updated = await this.prisma.copyTemplate.update({
      where: { id },
      data: {
        ...(params.type !== undefined ? { type: params.type } : {}),
        ...(params.text !== undefined ? { text: params.text } : {}),
        ...(params.conditions !== undefined
          ? { conditions_json: params.conditions ?? Prisma.JsonNull }
          : {}),
        ...(params.weight !== undefined ? { weight: params.weight } : {}),
        ...(params.isEnabled !== undefined
          ? { is_enabled: params.isEnabled }
          : {}),
        updated_by_admin_id: params.adminId,
      },
    });

    await this.auditService.createLog({
      actorAdminId: params.adminId,
      action: 'update',
      resourceType: 'copy_template',
      resourceId: id,
      diff: buildDiff(existing, updated),
      ip: params.ip,
      userAgent: params.userAgent,
    });

    return { updated: true };
  }

  async setEnabled(
    id: string,
    isEnabled: boolean,
    params: { adminId: string; ip?: string | null; userAgent?: string | null },
  ) {
    const existing = await this.prisma.copyTemplate.findFirst({
      where: { id, deleted_at: null },
    });

    if (!existing) {
      throw new BusinessException(
        AppErrorCode.COPY_TEMPLATE_NOT_FOUND,
        'Copy template not found',
        HttpStatus.NOT_FOUND,
      );
    }

    const updated = await this.prisma.copyTemplate.update({
      where: { id },
      data: { is_enabled: isEnabled, updated_by_admin_id: params.adminId },
    });

    await this.auditService.createLog({
      actorAdminId: params.adminId,
      action: isEnabled ? 'activate' : 'deactivate',
      resourceType: 'copy_template',
      resourceId: id,
      diff: { is_enabled: { before: existing.is_enabled, after: updated.is_enabled } },
      ip: params.ip,
      userAgent: params.userAgent,
    });

    return { is_enabled: updated.is_enabled };
  }

  async remove(
    id: string,
    params: { adminId: string; ip?: string | null; userAgent?: string | null },
  ) {
    const existing = await this.prisma.copyTemplate.findFirst({
      where: { id, deleted_at: null },
    });

    if (!existing) {
      throw new BusinessException(
        AppErrorCode.COPY_TEMPLATE_NOT_FOUND,
        'Copy template not found',
        HttpStatus.NOT_FOUND,
      );
    }

    await this.prisma.copyTemplate.update({
      where: { id },
      data: {
        deleted_at: new Date(),
        is_enabled: false,
        updated_by_admin_id: params.adminId,
      },
    });

    await this.auditService.createLog({
      actorAdminId: params.adminId,
      action: 'delete',
      resourceType: 'copy_template',
      resourceId: id,
      diff: { deleted_at: { before: existing.deleted_at, after: new Date() } },
      ip: params.ip,
      userAgent: params.userAgent,
    });

    return { deleted: true };
  }
}

function normalizeConditions(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }
  return value as Record<string, unknown>;
}

function matchConditions(
  value: unknown,
  filters: { trace_tag?: string; mood?: string; direction_id?: string },
) {
  if (!filters.trace_tag && !filters.mood && !filters.direction_id) {
    return true;
  }
  const conditions = normalizeConditions(value);
  if (filters.trace_tag && conditions.trace_tag !== filters.trace_tag) {
    return false;
  }
  if (filters.mood && conditions.mood !== filters.mood) {
    return false;
  }
  if (filters.direction_id && conditions.direction_id !== filters.direction_id) {
    return false;
  }
  return true;
}

function buildDiff(before: CopyTemplate, after: CopyTemplate) {
  const fields: Array<keyof CopyTemplate> = [
    'type',
    'text',
    'conditions_json',
    'weight',
    'is_enabled',
  ];
  const diff: Record<string, { before: unknown; after: unknown }> = {};
  fields.forEach((field) => {
    if (before[field] !== after[field]) {
      diff[field] = { before: before[field], after: after[field] };
    }
  });
  return diff;
}
