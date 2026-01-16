import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AdminAuditService {
  constructor(private readonly prisma: PrismaService) {}

  async createLog(params: {
    actorAdminId: string;
    action: string;
    resourceType: string;
    resourceId: string;
    diff?: Record<string, unknown> | null;
    ip?: string | null;
    userAgent?: string | null;
  }) {
    await this.prisma.auditLog.create({
      data: {
        actor_admin_id: params.actorAdminId,
        action: params.action,
        resource_type: params.resourceType,
        resource_id: params.resourceId,
        diff_json: params.diff ? params.diff : Prisma.JsonNull,
        ip: params.ip ?? null,
        user_agent: params.userAgent ?? null,
      },
    });
  }

  async listLogs(params: {
    resourceType?: string;
    resourceId?: string;
    actorAdminId?: string;
    dateFrom?: Date;
    dateTo?: Date;
    page: number;
    pageSize: number;
  }) {
    const where: Prisma.AuditLogWhereInput = {
      ...(params.resourceType ? { resource_type: params.resourceType } : {}),
      ...(params.resourceId ? { resource_id: params.resourceId } : {}),
      ...(params.actorAdminId ? { actor_admin_id: params.actorAdminId } : {}),
      ...(params.dateFrom || params.dateTo
        ? {
            created_at: {
              ...(params.dateFrom ? { gte: params.dateFrom } : {}),
              ...(params.dateTo ? { lte: params.dateTo } : {}),
            },
          }
        : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip: (params.page - 1) * params.pageSize,
        take: params.pageSize,
        include: { actor: true },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      items: items.map((item) => ({
        id: item.id,
        action: item.action,
        resource_type: item.resource_type,
        resource_id: item.resource_id,
        actor: item.actor
          ? { id: item.actor.id, name: item.actor.name }
          : null,
        diff: item.diff_json ?? null,
        created_at: item.created_at,
      })),
      page: params.page,
      page_size: params.pageSize,
      total,
    };
  }
}
