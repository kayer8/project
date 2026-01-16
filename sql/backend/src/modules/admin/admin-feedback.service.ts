import { HttpStatus, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { BusinessException } from '../../common/exceptions/business.exception';
import { AppErrorCode } from '../../common/exceptions/app-error-code';
import { AdminAuditService } from './admin-audit.service';

@Injectable()
export class AdminFeedbackService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AdminAuditService,
  ) {}

  async list(params: {
    status?: string;
    type?: string;
    assigneeAdminId?: string;
    q?: string;
    dateFrom?: Date;
    dateTo?: Date;
    tag?: string;
    page: number;
    pageSize: number;
  }) {
    const where: Prisma.FeedbackTicketWhereInput = {
      ...(params.status ? { status: params.status } : {}),
      ...(params.type ? { type: params.type } : {}),
      ...(params.assigneeAdminId
        ? { assignee_admin_id: params.assigneeAdminId }
        : {}),
      ...(params.q
        ? {
            OR: [
              { id: { contains: params.q } },
              { content: { contains: params.q } },
            ],
          }
        : {}),
      ...(params.dateFrom || params.dateTo
        ? {
            created_at: {
              ...(params.dateFrom ? { gte: params.dateFrom } : {}),
              ...(params.dateTo ? { lte: params.dateTo } : {}),
            },
          }
        : {}),
      ...(params.tag
        ? { tags_json: { array_contains: [params.tag] } }
        : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.feedbackTicket.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip: (params.page - 1) * params.pageSize,
        take: params.pageSize,
        include: { assignee_admin: true },
      }),
      this.prisma.feedbackTicket.count({ where }),
    ]);

    return {
      items: items.map((item) => ({
        id: item.id,
        type: item.type,
        status: item.status,
        content_preview: item.content.slice(0, 60),
        tags: parseStringArray(item.tags_json),
        assignee: item.assignee_admin
          ? { id: item.assignee_admin.id, name: item.assignee_admin.name }
          : null,
        created_at: item.created_at,
      })),
      page: params.page,
      page_size: params.pageSize,
      total,
    };
  }

  async getById(id: string) {
    const ticket = await this.prisma.feedbackTicket.findUnique({
      where: { id },
      include: { assignee_admin: true, user: true },
    });

    if (!ticket) {
      throw new BusinessException(
        AppErrorCode.FEEDBACK_TICKET_NOT_FOUND,
        'Feedback ticket not found',
        HttpStatus.NOT_FOUND,
      );
    }

    const recentSet = await this.prisma.dailyTaskSet.findFirst({
      where: { user_id: ticket.user_id },
      orderBy: { date: 'desc' },
      select: { id: true },
    });

    const recentNight = await this.prisma.nightSession.findFirst({
      where: { user_id: ticket.user_id },
      orderBy: { date: 'desc' },
      select: { id: true },
    });

    const lastActiveSet = await this.prisma.dailyTaskSet.findFirst({
      where: { user_id: ticket.user_id },
      orderBy: { date: 'desc' },
      select: { date: true },
    });

    const createdDaysAgo = ticket.user
      ? Math.floor(
          (Date.now() - ticket.user.created_at.getTime()) /
            (24 * 60 * 60 * 1000),
        )
      : null;

    const timeline = normalizeNotes(ticket.internal_notes_json);
    const timelineAdmins = Array.from(
      new Set(
        timeline
          .map((item) => (typeof item.by === 'string' ? item.by : null))
          .filter((item): item is string => Boolean(item)),
      ),
    );
    const adminNames = timelineAdmins.length
      ? await this.prisma.adminUser.findMany({
          where: { id: { in: timelineAdmins } },
          select: { id: true, name: true },
        })
      : [];
    const adminNameMap = new Map(
      adminNames.map((admin) => [admin.id, admin.name]),
    );

    return {
      ticket: {
        id: ticket.id,
        type: ticket.type,
        status: ticket.status,
        content: ticket.content,
        contact: ticket.contact ?? '',
        created_at: ticket.created_at,
        tags: parseStringArray(ticket.tags_json),
        assignee: ticket.assignee_admin
          ? { id: ticket.assignee_admin.id, name: ticket.assignee_admin.name }
          : null,
      },
      context: {
        user: {
          user_hash: hashUser(ticket.user_id),
          created_days_ago: createdDaysAgo,
          last_active_date: lastActiveSet?.date ?? null,
        },
        recent: {
          today_set_id: recentSet?.id ?? null,
          last_night_session_id: recentNight?.id ?? null,
        },
      },
      timeline: timeline.map((item) => ({
        ...item,
        by:
          typeof item.by === 'string'
            ? adminNameMap.get(item.by) ?? item.by
            : item.by,
      })),
    };
  }

  async assign(
    id: string,
    assigneeAdminId: string,
    params: { adminId: string; ip?: string | null; userAgent?: string | null },
  ) {
    await this.ensureTicket(id);

    await this.prisma.feedbackTicket.update({
      where: { id },
      data: {
        assignee_admin_id: assigneeAdminId,
        updated_at: new Date(),
      },
    });

    await this.auditService.createLog({
      actorAdminId: params.adminId,
      action: 'assign',
      resourceType: 'feedback_ticket',
      resourceId: id,
      diff: { assignee_admin_id: assigneeAdminId },
      ip: params.ip,
      userAgent: params.userAgent,
    });

    return { assigned: true };
  }

  async updateStatus(
    id: string,
    status: string,
    note: string | undefined,
    params: { adminId: string; ip?: string | null; userAgent?: string | null },
  ) {
    await this.ensureTicket(id);

    const notes = await this.appendNote(id, {
      action: 'status_change',
      text: note ?? '',
      by_admin_id: params.adminId,
      is_internal: true,
    });

    await this.prisma.feedbackTicket.update({
      where: { id },
      data: {
        status,
        internal_notes_json: notes,
        updated_at: new Date(),
      },
    });

    await this.auditService.createLog({
      actorAdminId: params.adminId,
      action: 'status_change',
      resourceType: 'feedback_ticket',
      resourceId: id,
      diff: { status },
      ip: params.ip,
      userAgent: params.userAgent,
    });

    return { status };
  }

  async updateTags(
    id: string,
    tags: string[],
    params: { adminId: string; ip?: string | null; userAgent?: string | null },
  ) {
    await this.ensureTicket(id);

    await this.prisma.feedbackTicket.update({
      where: { id },
      data: {
        tags_json: tags,
        updated_at: new Date(),
      },
    });

    await this.auditService.createLog({
      actorAdminId: params.adminId,
      action: 'update',
      resourceType: 'feedback_ticket',
      resourceId: id,
      diff: { tags },
      ip: params.ip,
      userAgent: params.userAgent,
    });

    return { tags };
  }

  async addComment(
    id: string,
    text: string,
    isInternal: boolean,
    params: { adminId: string; ip?: string | null; userAgent?: string | null },
  ) {
    await this.ensureTicket(id);

    const notes = await this.appendNote(id, {
      action: 'comment',
      text,
      by_admin_id: params.adminId,
      is_internal: isInternal,
    });

    await this.prisma.feedbackTicket.update({
      where: { id },
      data: {
        internal_notes_json: notes,
        updated_at: new Date(),
      },
    });

    await this.auditService.createLog({
      actorAdminId: params.adminId,
      action: 'update',
      resourceType: 'feedback_ticket',
      resourceId: id,
      diff: { comment: text },
      ip: params.ip,
      userAgent: params.userAgent,
    });

    return { comment_id: `c_${Date.now()}` };
  }

  private async ensureTicket(id: string) {
    const ticket = await this.prisma.feedbackTicket.findUnique({
      where: { id },
    });
    if (!ticket) {
      throw new BusinessException(
        AppErrorCode.FEEDBACK_TICKET_NOT_FOUND,
        'Feedback ticket not found',
        HttpStatus.NOT_FOUND,
      );
    }
    return ticket;
  }

  private async appendNote(
    id: string,
    note: {
      action: string;
      text: string;
      by_admin_id: string;
      is_internal: boolean;
    },
  ) {
    const ticket = await this.prisma.feedbackTicket.findUnique({
      where: { id },
      select: { internal_notes_json: true },
    });
    const existing = normalizeNotes(ticket?.internal_notes_json);
    return [
      ...existing,
      {
        at: new Date().toISOString(),
        by: note.by_admin_id,
        action: note.action,
        text: note.text,
        is_internal: note.is_internal,
      },
    ];
  }
}

function parseStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((item): item is string => typeof item === 'string');
}

function normalizeNotes(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }
  return value as Array<Record<string, unknown>>;
}

function hashUser(userId: string) {
  return `u_${userId.slice(0, 4)}`;
}
