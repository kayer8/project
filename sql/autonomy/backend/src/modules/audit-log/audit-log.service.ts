import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AdminAuditLogListQueryDto } from './dto/audit-log.dto';
import { AdminAuditContext } from './audit-log.types';

interface RecordAdminAuditLogParams {
  context?: AdminAuditContext;
  action: string;
  resourceType: string;
  resourceId: string;
  resourceName?: string | null;
  snapshot?: Record<string, unknown> | null;
}

@Injectable()
export class AuditLogService {
  constructor(private readonly prisma: PrismaService) {}

  async listAdmin(query: AdminAuditLogListQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const skip = (page - 1) * pageSize;
    const where: Prisma.AuditLogWhereInput = {};

    if (query.keyword?.trim()) {
      const keyword = query.keyword.trim();
      where.OR = [
        { resourceName: { contains: keyword } },
        { resourceId: { contains: keyword } },
        { actorLabel: { contains: keyword } },
      ];
    }

    if (query.resourceType?.trim()) {
      where.resourceType = query.resourceType.trim();
    }

    if (query.action?.trim()) {
      where.action = query.action.trim();
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.auditLog.findMany({
        where,
        skip,
        take: pageSize,
        include: {
          actorAdmin: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
        orderBy: [{ createdAt: 'desc' }],
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      items: items.map((item) => ({
        id: item.id,
        action: item.action,
        resourceType: item.resourceType,
        resourceId: item.resourceId,
        resourceName: item.resourceName,
        actorLabel:
          item.actorLabel ||
          (item.actorAdmin ? `${item.actorAdmin.name} (${item.actorAdmin.email})` : '-') ||
          '-',
        ip: item.ip,
        userAgent: item.userAgent,
        snapshotJson: item.snapshotJson,
        createdAt: item.createdAt,
      })),
      total,
      page,
      pageSize,
    };
  }

  async recordAdminAction(params: RecordAdminAuditLogParams) {
    if (!params.context?.admin) {
      return null;
    }

    const { admin, ip, userAgent } = params.context;

    return this.prisma.auditLog.create({
      data: {
        actorType: 'ADMIN',
        actorAdminId: admin.adminId.startsWith('bootstrap:') ? null : admin.adminId,
        actorLabel: admin.email,
        action: params.action,
        resourceType: params.resourceType,
        resourceId: params.resourceId,
        resourceName: params.resourceName ?? null,
        snapshotJson: this.normalizeSnapshot(params.snapshot),
        ip: ip ?? null,
        userAgent: userAgent ?? null,
      },
    });
  }

  private normalizeSnapshot(snapshot?: Record<string, unknown> | null): Prisma.InputJsonValue | undefined {
    if (!snapshot) {
      return undefined;
    }

    return JSON.parse(JSON.stringify(snapshot)) as Prisma.InputJsonValue;
  }
}
