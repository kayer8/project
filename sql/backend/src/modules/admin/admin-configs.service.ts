import { HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BusinessException } from '../../common/exceptions/business.exception';
import { AppErrorCode } from '../../common/exceptions/app-error-code';
import { AdminAuditService } from './admin-audit.service';

@Injectable()
export class AdminConfigsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AdminAuditService,
  ) {}

  async getConfig(key: string) {
    const configs = await this.prisma.appConfig.findMany({
      where: { key, status: { in: ['active', 'draft'] } },
      orderBy: { version: 'desc' },
    });

    const active = configs.find((item) => item.status === 'active') ?? null;
    const draft = configs.find((item) => item.status === 'draft') ?? null;

    return {
      key,
      active: active
        ? {
            id: active.id,
            version: active.version,
            value: active.value_json,
          }
        : null,
      draft: draft
        ? {
            id: draft.id,
            version: draft.version,
            value: draft.value_json,
          }
        : null,
    };
  }

  async saveDraft(params: {
    key: string;
    value: Record<string, unknown>;
    adminId: string;
    ip?: string | null;
    userAgent?: string | null;
  }) {
    const [existingDraft, maxVersion] = await this.prisma.$transaction([
      this.prisma.appConfig.findFirst({
        where: { key: params.key, status: 'draft' },
        orderBy: { version: 'desc' },
      }),
      this.prisma.appConfig.aggregate({
        where: { key: params.key },
        _max: { version: true },
      }),
    ]);

    const version = (maxVersion._max.version ?? 0) + (existingDraft ? 0 : 1);

    const draft = existingDraft
      ? await this.prisma.appConfig.update({
          where: { id: existingDraft.id },
          data: {
            value_json: params.value,
            updated_by_admin_id: params.adminId,
          },
        })
      : await this.prisma.appConfig.create({
          data: {
            key: params.key,
            value_json: params.value,
            version,
            status: 'draft',
            updated_by_admin_id: params.adminId,
          },
        });

    await this.auditService.createLog({
      actorAdminId: params.adminId,
      action: 'update',
      resourceType: 'config',
      resourceId: draft.id,
      diff: { value: params.value },
      ip: params.ip,
      userAgent: params.userAgent,
    });

    return { draft_id: draft.id, version: draft.version };
  }

  async publish(params: {
    key: string;
    draftId: string;
    comment?: string | null;
    adminId: string;
    ip?: string | null;
    userAgent?: string | null;
  }) {
    const draft = await this.prisma.appConfig.findFirst({
      where: { key: params.key, id: params.draftId, status: 'draft' },
    });

    if (!draft) {
      throw new BusinessException(
        AppErrorCode.CONFIG_NOT_FOUND,
        'Draft config not found',
        HttpStatus.NOT_FOUND,
      );
    }

    await this.prisma.$transaction([
      this.prisma.appConfig.updateMany({
        where: { key: params.key, status: 'active' },
        data: { status: 'archived' },
      }),
      this.prisma.appConfig.update({
        where: { id: draft.id },
        data: {
          status: 'active',
          comment: params.comment ?? draft.comment,
          updated_by_admin_id: params.adminId,
        },
      }),
    ]);

    await this.auditService.createLog({
      actorAdminId: params.adminId,
      action: 'publish',
      resourceType: 'config',
      resourceId: draft.id,
      diff: { active_version: draft.version },
      ip: params.ip,
      userAgent: params.userAgent,
    });

    return { active_version: draft.version };
  }

  async rollback(params: {
    key: string;
    toVersion: number;
    comment?: string | null;
    adminId: string;
    ip?: string | null;
    userAgent?: string | null;
  }) {
    const target = await this.prisma.appConfig.findFirst({
      where: { key: params.key, version: params.toVersion },
    });

    if (!target) {
      throw new BusinessException(
        AppErrorCode.CONFIG_NOT_FOUND,
        'Config version not found',
        HttpStatus.NOT_FOUND,
      );
    }

    await this.prisma.$transaction([
      this.prisma.appConfig.updateMany({
        where: { key: params.key, status: 'active' },
        data: { status: 'archived' },
      }),
      this.prisma.appConfig.update({
        where: { id: target.id },
        data: {
          status: 'active',
          comment: params.comment ?? target.comment,
          updated_by_admin_id: params.adminId,
        },
      }),
    ]);

    await this.auditService.createLog({
      actorAdminId: params.adminId,
      action: 'publish',
      resourceType: 'config',
      resourceId: target.id,
      diff: { active_version: target.version },
      ip: params.ip,
      userAgent: params.userAgent,
    });

    return { active_version: target.version };
  }

  async history(key: string) {
    const items = await this.prisma.appConfig.findMany({
      where: { key },
      orderBy: { version: 'desc' },
      include: { updated_by_admin: true },
    });

    return {
      items: items.map((item) => ({
        id: item.id,
        version: item.version,
        status: item.status,
        value: item.value_json,
        comment: item.comment,
        updated_at: item.updated_at,
        updated_by: item.updated_by_admin
          ? {
              id: item.updated_by_admin.id,
              name: item.updated_by_admin.name,
            }
          : null,
      })),
    };
  }
}
