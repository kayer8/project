import { HttpStatus, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { BusinessException } from '../../common/exceptions/business.exception';
import { AppErrorCode } from '../../common/exceptions/app-error-code';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { AdminAuditContext } from '../audit-log/audit-log.types';
import {
  AdminDisclosureContentListQueryDto,
  CreateAdminDisclosureContentDto,
  UpdateAdminDisclosureContentDto,
} from './dto/disclosure-content.dto';

@Injectable()
export class DisclosureService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogService: AuditLogService,
  ) {}

  async listAdmin(query: AdminDisclosureContentListQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const skip = (page - 1) * pageSize;
    const where: Prisma.DisclosureContentWhereInput = {};

    if (query.keyword?.trim()) {
      const keyword = query.keyword.trim();
      where.OR = [
        { title: { contains: keyword } },
        { publisher: { contains: keyword } },
        { summary: { contains: keyword } },
        { category: { contains: keyword } },
        { content: { contains: keyword } },
      ];
    }

    if (query.category?.trim()) {
      where.category = query.category.trim();
    }

    if (query.status?.trim()) {
      where.status = query.status.trim();
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.disclosureContent.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
      }),
      this.prisma.disclosureContent.count({ where }),
    ]);

    return {
      items: items.map((item) => this.mapItem(item)),
      total,
      page,
      pageSize,
    };
  }

  async getAdminDetail(id: string) {
    const content = await this.prisma.disclosureContent.findUnique({
      where: { id },
    });

    if (!content) {
      throw new BusinessException(
        AppErrorCode.DISCLOSURE_CONTENT_NOT_FOUND,
        'Disclosure content not found',
        HttpStatus.NOT_FOUND,
      );
    }

    return this.mapItem(content);
  }

  async createAdmin(dto: CreateAdminDisclosureContentDto, context?: AdminAuditContext) {
    const data = this.buildCreateData(dto);
    const created = await this.prisma.disclosureContent.create({
      data: {
        ...data,
        status: 'DRAFT',
      },
    });

    const createdItem = this.mapItem(created);
    await this.auditLogService.recordAdminAction({
      context,
      action: 'CREATE',
      resourceType: 'DISCLOSURE_CONTENT',
      resourceId: created.id,
      resourceName: created.title,
      snapshot: {
        after: createdItem,
      },
    });

    return createdItem;
  }

  async updateAdmin(id: string, dto: UpdateAdminDisclosureContentDto, context?: AdminAuditContext) {
    const before = await this.getAdminDetail(id);
    const data = this.buildMutationData(dto);

    await this.prisma.disclosureContent.update({
      where: { id },
      data,
    });

    const updated = await this.getAdminDetail(id);
    await this.auditLogService.recordAdminAction({
      context,
      action: 'UPDATE',
      resourceType: 'DISCLOSURE_CONTENT',
      resourceId: id,
      resourceName: updated.title,
      snapshot: {
        before,
        after: updated,
      },
    });

    return updated;
  }

  async publishAdmin(id: string, context?: AdminAuditContext) {
    const before = await this.getAdminDetail(id);

    await this.prisma.disclosureContent.update({
      where: { id },
      data: {
        status: 'PUBLISHED',
        publishedAt: new Date(),
      },
    });

    const published = await this.getAdminDetail(id);
    await this.auditLogService.recordAdminAction({
      context,
      action: 'PUBLISH',
      resourceType: 'DISCLOSURE_CONTENT',
      resourceId: id,
      resourceName: published.title,
      snapshot: {
        before,
        after: published,
      },
    });

    return published;
  }

  async removeAdmin(id: string, context?: AdminAuditContext) {
    const before = await this.getAdminDetail(id);
    await this.prisma.disclosureContent.delete({
      where: { id },
    });

    await this.auditLogService.recordAdminAction({
      context,
      action: 'DELETE',
      resourceType: 'DISCLOSURE_CONTENT',
      resourceId: id,
      resourceName: before.title,
      snapshot: {
        before,
      },
    });

    return {
      id,
      removed: true,
    };
  }

  private buildMutationData(dto: Partial<CreateAdminDisclosureContentDto>) {
    const publishStartAt = dto.publishStartAt ? new Date(dto.publishStartAt) : undefined;
    const publishEndAt = dto.publishEndAt ? new Date(dto.publishEndAt) : undefined;

    if (
      publishStartAt &&
      publishEndAt &&
      !Number.isNaN(publishStartAt.getTime()) &&
      !Number.isNaN(publishEndAt.getTime()) &&
      publishEndAt.getTime() < publishStartAt.getTime()
    ) {
      throw new BusinessException(
        AppErrorCode.INVALID_OPERATION,
        'Publish end time cannot be earlier than publish start time',
        HttpStatus.BAD_REQUEST,
      );
    }

    return {
      ...(dto.title !== undefined ? { title: dto.title.trim() } : {}),
      ...(dto.category !== undefined ? { category: dto.category.trim() } : {}),
      ...(dto.publisher !== undefined ? { publisher: dto.publisher.trim() } : {}),
      ...(dto.summary !== undefined ? { summary: dto.summary.trim() || null } : {}),
      ...(dto.content !== undefined ? { content: dto.content.trim() } : {}),
      ...(dto.publishStartAt !== undefined ? { publishStartAt: dto.publishStartAt ? publishStartAt : null } : {}),
      ...(dto.publishEndAt !== undefined ? { publishEndAt: dto.publishEndAt ? publishEndAt : null } : {}),
    };
  }

  private buildCreateData(dto: CreateAdminDisclosureContentDto): Prisma.DisclosureContentCreateInput {
    const mutationData = this.buildMutationData(dto);

    return {
      title: dto.title.trim(),
      category: dto.category.trim(),
      publisher: dto.publisher.trim(),
      summary: dto.summary?.trim() || null,
      content: dto.content.trim(),
      publishStartAt: mutationData.publishStartAt ?? null,
      publishEndAt: mutationData.publishEndAt ?? null,
    };
  }

  private async ensureContentExists(id: string) {
    const content = await this.prisma.disclosureContent.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!content) {
      throw new BusinessException(
        AppErrorCode.DISCLOSURE_CONTENT_NOT_FOUND,
        'Disclosure content not found',
        HttpStatus.NOT_FOUND,
      );
    }
  }

  private mapItem(item: Prisma.DisclosureContentGetPayload<Record<string, never>>) {
    return {
      id: item.id,
      title: item.title,
      category: item.category,
      publisher: item.publisher,
      summary: item.summary,
      content: item.content,
      status: item.status,
      publishStartAt: item.publishStartAt,
      publishEndAt: item.publishEndAt,
      publishedAt: item.publishedAt,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }
}
