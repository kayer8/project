import { HttpStatus, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { BusinessException } from '../../common/exceptions/business.exception';
import { AppErrorCode } from '../../common/exceptions/app-error-code';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { AdminAuditContext } from '../audit-log/audit-log.types';
import {
  AdminVoteListQueryDto,
  CreateAdminVoteDto,
  UpdateAdminVoteDto,
  VoteScopeSummaryQueryDto,
} from './dto/vote.dto';
import { VOTE_SCOPE_TYPES } from './vote.constants';

@Injectable()
export class VoteService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogService: AuditLogService,
  ) {}

  async listAdmin(query: AdminVoteListQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const skip = (page - 1) * pageSize;
    const where = this.buildListWhere(query);

    const [items, total] = await this.prisma.$transaction([
      this.prisma.vote.findMany({
        where,
        skip,
        take: pageSize,
        include: {
          options: {
            orderBy: [{ sortNo: 'asc' }, { createdAt: 'asc' }],
          },
        },
        orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
      }),
      this.prisma.vote.count({ where }),
    ]);

    return {
      items: items.map((item) => this.mapItem(item)),
      total,
      page,
      pageSize,
    };
  }

  async getAdminDetail(id: string) {
    const vote = await this.prisma.vote.findUnique({
      where: { id },
      include: {
        options: {
          orderBy: [{ sortNo: 'asc' }, { createdAt: 'asc' }],
        },
      },
    });

    if (!vote) {
      throw new BusinessException(AppErrorCode.VOTE_NOT_FOUND, 'Vote not found', HttpStatus.NOT_FOUND);
    }

    return this.mapItem(vote);
  }

  async getScopeSummary(query: VoteScopeSummaryQueryDto) {
    const scopeFields = await this.resolveScopeFields(query);
    return {
      scope: scopeFields.scope,
      scopeType: scopeFields.scopeType,
      scopeAudience: scopeFields.scopeAudience,
      scopeBuildingId: scopeFields.scopeBuildingId,
      scopeBuildingName: scopeFields.scopeBuildingName,
      scopeBuildingIds: scopeFields.scopeBuildingIds,
      scopeBuildingNames: scopeFields.scopeBuildingNames,
      totalHouseholds: scopeFields.totalHouseholds,
      authenticatedUserCount: scopeFields.authenticatedUserCount,
    };
  }

  async createAdmin(dto: CreateAdminVoteDto, context?: AdminAuditContext) {
    const scopeFields = await this.resolveScopeFields({
      type: dto.type,
      scopeType: dto.scopeType,
      scopeBuildingId: dto.scopeBuildingId,
      scopeBuildingIds: dto.scopeBuildingIds,
    });
    const created = await this.prisma.vote.create({
      data: this.buildCreateData(dto, scopeFields),
    });

    const createdItem = await this.getAdminDetail(created.id);
    await this.auditLogService.recordAdminAction({
      context,
      action: 'CREATE',
      resourceType: 'VOTE',
      resourceId: created.id,
      resourceName: created.title,
      snapshot: {
        after: createdItem,
      },
    });

    return createdItem;
  }

  async updateAdmin(id: string, dto: UpdateAdminVoteDto, context?: AdminAuditContext) {
    const before = await this.getAdminDetail(id);
    const scopeFields = await this.resolveScopeFields({
      type: dto.type ?? before.type,
      scopeType: dto.scopeType ?? before.scopeType,
      scopeBuildingId:
        dto.scopeType === 'ALL'
          ? null
          : dto.scopeBuildingId !== undefined
            ? dto.scopeBuildingId
            : before.scopeBuildingId,
      scopeBuildingIds:
        dto.scopeType === 'ALL'
          ? []
          : dto.scopeBuildingIds !== undefined
            ? dto.scopeBuildingIds
            : before.scopeBuildingIds,
    });

    await this.prisma.vote.update({
      where: { id },
      data: this.buildMutationData(dto, scopeFields),
    });

    const updated = await this.getAdminDetail(id);
    await this.auditLogService.recordAdminAction({
      context,
      action: 'UPDATE',
      resourceType: 'VOTE',
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
    if (before.status === 'ENDED') {
      throw new BusinessException(AppErrorCode.INVALID_OPERATION, 'Ended vote cannot be published again', HttpStatus.BAD_REQUEST);
    }

    await this.prisma.vote.update({
      where: { id },
      data: {
        status: 'ONGOING',
        publishedAt: before.publishedAt ? new Date(before.publishedAt) : new Date(),
      },
    });

    const published = await this.getAdminDetail(id);
    await this.auditLogService.recordAdminAction({
      context,
      action: 'PUBLISH',
      resourceType: 'VOTE',
      resourceId: id,
      resourceName: published.title,
      snapshot: {
        before,
        after: published,
      },
    });

    return published;
  }

  async endAdmin(id: string, context?: AdminAuditContext) {
    const before = await this.getAdminDetail(id);
    if (before.status === 'ENDED') {
      return before;
    }

    await this.prisma.vote.update({
      where: { id },
      data: {
        status: 'ENDED',
        endedAt: new Date(),
      },
    });

    const ended = await this.getAdminDetail(id);
    await this.auditLogService.recordAdminAction({
      context,
      action: 'STATUS_UPDATE',
      resourceType: 'VOTE',
      resourceId: id,
      resourceName: ended.title,
      snapshot: {
        before,
        after: ended,
      },
    });

    return ended;
  }

  async removeAdmin(id: string, context?: AdminAuditContext) {
    const before = await this.getAdminDetail(id);
    await this.prisma.vote.delete({ where: { id } });

    await this.auditLogService.recordAdminAction({
      context,
      action: 'DELETE',
      resourceType: 'VOTE',
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

  private buildListWhere(query: AdminVoteListQueryDto): Prisma.VoteWhereInput {
    const where: Prisma.VoteWhereInput = {};

    if (query.keyword?.trim()) {
      const keyword = query.keyword.trim();
      where.OR = [
        { title: { contains: keyword } },
        { sponsor: { contains: keyword } },
        { scope: { contains: keyword } },
        { description: { contains: keyword } },
      ];
    }

    if (query.type?.trim()) {
      where.type = query.type.trim();
    }

    if (query.status?.trim()) {
      where.status = query.status.trim();
    }

    if (query.result?.trim()) {
      where.result = query.result.trim();
    }

    return where;
  }

  private buildCreateData(
    dto: CreateAdminVoteDto,
    scopeFields: {
      scope: string;
      scopeType: string;
      scopeAudience: string;
      scopeBuildingId: string | null;
      scopeBuildingName: string | null;
      scopeBuildingIds: string[];
      scopeBuildingNames: string[];
      totalHouseholds: number;
    },
  ): Prisma.VoteCreateInput {
    const totalHouseholds = scopeFields.totalHouseholds;
    const participantCount = Math.max(0, Math.trunc(dto.participantCount ?? 0));
    const normalizedOptions = this.normalizeOptions(dto.options);

    if (totalHouseholds > 0 && participantCount > totalHouseholds) {
      throw new BusinessException(
        AppErrorCode.INVALID_OPERATION,
        'Participant count cannot be greater than total households',
        HttpStatus.BAD_REQUEST,
      );
    }

    return {
      title: dto.title.trim(),
      type: dto.type.trim(),
      sponsor: dto.sponsor.trim(),
      scope: scopeFields.scope,
      scopeType: scopeFields.scopeType,
      scopeAudience: scopeFields.scopeAudience,
      scopeBuildingId: scopeFields.scopeBuildingId,
      scopeBuildingName: scopeFields.scopeBuildingName,
      scopeBuildingIdsJson: scopeFields.scopeBuildingIds,
      scopeBuildingNamesJson: scopeFields.scopeBuildingNames,
      options: {
        create: normalizedOptions.map((option, index) => ({
          optionText: option,
          sortNo: index + 1,
        })),
      },
      description: dto.description?.trim() || null,
      deadline: dto.deadline ? new Date(dto.deadline) : null,
      totalHouseholds,
      participantCount,
      passRate: Number(dto.passRate ?? 0),
      status: 'DRAFT',
      result: dto.result ?? 'PENDING',
      publishedAt: null,
      endedAt: null,
    };
  }

  private buildMutationData(
    dto: Partial<CreateAdminVoteDto>,
    scopeFields: {
      scope: string;
      scopeType: string;
      scopeAudience: string;
      scopeBuildingId: string | null;
      scopeBuildingName: string | null;
      scopeBuildingIds: string[];
      scopeBuildingNames: string[];
      totalHouseholds: number;
    },
  ): Prisma.VoteUpdateInput {
    const totalHouseholds = scopeFields.totalHouseholds;
    const participantCount =
      dto.participantCount === undefined ? undefined : Math.max(0, Math.trunc(dto.participantCount));
    const passRate = dto.passRate === undefined ? undefined : Number(dto.passRate);
    const normalizedOptions = dto.options === undefined ? undefined : this.normalizeOptions(dto.options);

    if (
      participantCount !== undefined &&
      participantCount > totalHouseholds &&
      totalHouseholds > 0
    ) {
      throw new BusinessException(
        AppErrorCode.INVALID_OPERATION,
        'Participant count cannot be greater than total households',
        HttpStatus.BAD_REQUEST,
      );
    }

    return {
      ...(dto.title !== undefined ? { title: dto.title.trim() } : {}),
      ...(dto.type !== undefined ? { type: dto.type.trim() } : {}),
      ...(dto.sponsor !== undefined ? { sponsor: dto.sponsor.trim() } : {}),
      ...(dto.type !== undefined || dto.scopeType !== undefined || dto.scopeBuildingId !== undefined
        ? {
            scope: scopeFields.scope,
            scopeType: scopeFields.scopeType,
            scopeAudience: scopeFields.scopeAudience,
            scopeBuildingId: scopeFields.scopeBuildingId,
            scopeBuildingName: scopeFields.scopeBuildingName,
            scopeBuildingIdsJson: scopeFields.scopeBuildingIds,
            scopeBuildingNamesJson: scopeFields.scopeBuildingNames,
            totalHouseholds: scopeFields.totalHouseholds,
          }
        : {}),
      ...(normalizedOptions !== undefined
        ? {
            options: {
              deleteMany: {},
              create: normalizedOptions.map((option, index) => ({
                optionText: option,
                sortNo: index + 1,
              })),
            },
          }
        : {}),
      ...(dto.description !== undefined ? { description: dto.description.trim() || null } : {}),
      ...(dto.deadline !== undefined
        ? { deadline: dto.deadline ? new Date(dto.deadline) : null }
        : {}),
      ...(totalHouseholds !== undefined ? { totalHouseholds } : {}),
      ...(participantCount !== undefined ? { participantCount } : {}),
      ...(passRate !== undefined ? { passRate } : {}),
      ...(dto.result !== undefined ? { result: dto.result.trim() } : {}),
    };
  }

  private normalizeOptions(options: Array<{ optionText: string }>) {
    const normalizedOptions = options
      .map((item) => item.optionText.trim())
      .filter((item) => item.length > 0);

    if (normalizedOptions.length < 2) {
      throw new BusinessException(
        AppErrorCode.INVALID_OPERATION,
        'Vote must contain at least two options',
        HttpStatus.BAD_REQUEST,
      );
    }

    return normalizedOptions;
  }

  private async resolveScopeFields(params: {
    type: string;
    scopeType?: string | null;
    scopeBuildingId?: string | null;
    scopeBuildingIds?: string[] | string | null;
  }) {
    const normalizedType = params.type.trim();
    const scopeAudience = normalizedType === 'FORMAL' ? 'OWNER' : 'RESIDENT';
    const audienceLabel = scopeAudience === 'OWNER' ? '业主' : '住户';
    const scopeType = params.scopeType && VOTE_SCOPE_TYPES.includes(params.scopeType as any) ? params.scopeType : 'ALL';

    if (scopeType === 'ALL') {
      const totalHouseholds = await this.countScopeHouseholds(scopeAudience, []);
      const authenticatedUserCount = await this.countAuthenticatedUsers(scopeAudience, []);
      return {
        scope: scopeAudience === 'OWNER' ? '全体业主' : '全部住户',
        scopeType,
        scopeAudience,
        scopeBuildingId: null,
        scopeBuildingName: null,
        scopeBuildingIds: [],
        scopeBuildingNames: [],
        totalHouseholds,
        authenticatedUserCount,
      };
    }

    const requestedBuildingIds = this.normalizeScopeBuildingIds(params.scopeBuildingIds, params.scopeBuildingId);
    if (requestedBuildingIds.length === 0) {
      throw new BusinessException(
        AppErrorCode.INVALID_OPERATION,
        'Building scope must specify at least one building',
        HttpStatus.BAD_REQUEST,
      );
    }

    const buildings = await this.prisma.building.findMany({
      where: { id: { in: requestedBuildingIds } },
      orderBy: [{ sortNo: 'asc' }, { buildingName: 'asc' }],
      select: {
        id: true,
        buildingName: true,
      },
    });

    if (buildings.length !== requestedBuildingIds.length) {
      throw new BusinessException(AppErrorCode.BUILDING_NOT_FOUND, 'Building not found', HttpStatus.NOT_FOUND);
    }

    const totalHouseholds = await this.countScopeHouseholds(
      scopeAudience,
      buildings.map((item) => item.id),
    );
    const authenticatedUserCount = await this.countAuthenticatedUsers(
      scopeAudience,
      buildings.map((item) => item.id),
    );
    const scopeBuildingIds = buildings.map((item) => item.id);
    const scopeBuildingNames = buildings.map((item) => item.buildingName);
    const scopeLabel =
      scopeBuildingNames.length === 1
        ? `${scopeBuildingNames[0]}${audienceLabel}`
        : `${scopeBuildingNames.join('、')}${audienceLabel}`;

    return {
      scope: scopeLabel,
      scopeType,
      scopeAudience,
      scopeBuildingId: scopeBuildingIds[0] ?? null,
      scopeBuildingName: scopeBuildingNames[0] ?? null,
      scopeBuildingIds,
      scopeBuildingNames,
      totalHouseholds,
      authenticatedUserCount,
    };
  }

  private normalizeScopeBuildingIds(scopeBuildingIds?: string[] | string | null, scopeBuildingId?: string | null) {
    const ids: string[] = [];

    if (Array.isArray(scopeBuildingIds)) {
      ids.push(...scopeBuildingIds);
    } else if (typeof scopeBuildingIds === 'string' && scopeBuildingIds.trim()) {
      ids.push(...scopeBuildingIds.split(','));
    }

    if (scopeBuildingId?.trim()) {
      ids.push(scopeBuildingId.trim());
    }

    return Array.from(
      new Set(
        ids
          .map((item) => item.trim())
          .filter((item) => item.length > 0),
      ),
    );
  }

  private async countScopeHouseholds(scopeAudience: string, buildingIds: string[]) {
    return this.prisma.house.count({
      where: {
        ...(buildingIds.length > 0 ? { buildingId: { in: buildingIds } } : {}),
        householdGroups: {
          some: {
            status: 'ACTIVE',
            ...(scopeAudience === 'OWNER' ? { groupType: 'OWNER_HOUSEHOLD' } : {}),
          },
        },
      },
    });
  }

  private async countAuthenticatedUsers(scopeAudience: string, buildingIds: string[]) {
    const items = await this.prisma.houseMemberRelation.findMany({
      where: {
        status: 'ACTIVE',
        ...(scopeAudience === 'OWNER' ? { relationType: 'MAIN_OWNER' } : {}),
        house: {
          ...(buildingIds.length > 0 ? { buildingId: { in: buildingIds } } : {}),
        },
        householdGroup: {
          status: 'ACTIVE',
          ...(scopeAudience === 'OWNER' ? { groupType: 'OWNER_HOUSEHOLD' } : {}),
        },
        user: {
          status: 'ACTIVE',
        },
      },
      distinct: ['userId'],
      select: {
        userId: true,
      },
    });

    return items.length;
  }

  private mapItem(
    item: Prisma.VoteGetPayload<{
      include: {
        options: true;
      };
    }>,
  ) {
    const participationRate =
      item.totalHouseholds > 0 ? Number(((item.participantCount / item.totalHouseholds) * 100).toFixed(1)) : 0;

    return {
      id: item.id,
      title: item.title,
      type: item.type,
      sponsor: item.sponsor,
      scope: item.scope,
      scopeType: item.scopeType,
      scopeAudience: item.scopeAudience,
      scopeBuildingId: item.scopeBuildingId,
      scopeBuildingName: item.scopeBuildingName,
      scopeBuildingIds: Array.isArray(item.scopeBuildingIdsJson) ? item.scopeBuildingIdsJson.map(String) : (item.scopeBuildingId ? [item.scopeBuildingId] : []),
      scopeBuildingNames: Array.isArray(item.scopeBuildingNamesJson) ? item.scopeBuildingNamesJson.map(String) : (item.scopeBuildingName ? [item.scopeBuildingName] : []),
      options: item.options.map((option) => ({
        id: option.id,
        optionText: option.optionText,
        sortNo: option.sortNo,
      })),
      description: item.description,
      totalHouseholds: item.totalHouseholds,
      participantCount: item.participantCount,
      participationRate,
      passRate: Number(item.passRate.toFixed(1)),
      result: item.result,
      status: item.status,
      deadline: item.deadline,
      publishedAt: item.publishedAt,
      endedAt: item.endedAt,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }
}
