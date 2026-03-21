import { HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BusinessException } from '../../common/exceptions/business.exception';
import { AppErrorCode } from '../../common/exceptions/app-error-code';
import { AuditLogService } from '../audit-log/audit-log.service';
import { AdminAuditContext } from '../audit-log/audit-log.types';
import {
  AdminMemberListQueryDto,
  CreateAdminMemberDto,
  UpdateAdminMemberDto,
} from './dto/member.dto';

const memberRelationLabelMap: Record<string, string> = {
  MAIN_OWNER: '主业主',
  FAMILY_MEMBER: '家庭成员',
  MAIN_TENANT: '主租户',
  CO_RESIDENT: '同住成员',
  AGENT: '代办人',
};

const householdGroupLabelMap: Record<string, string> = {
  OWNER_HOUSEHOLD: '业主住户组',
  TENANT_HOUSEHOLD: '租户住户组',
  CO_LIVING_HOUSEHOLD: '合住住户组',
};

@Injectable()
export class MemberService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogService: AuditLogService,
  ) {}

  async listMine(userId: string) {
    const relations = await this.prisma.houseMemberRelation.findMany({
      where: {
        userId,
      },
      include: {
        user: true,
        house: {
          include: {
            building: true,
          },
        },
        householdGroup: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return relations.map((item) => this.mapMemberDetail(item));
  }

  async getMineMember(userId: string, relationId: string) {
    const relation = await this.prisma.houseMemberRelation.findFirst({
      where: {
        id: relationId,
        userId,
      },
      include: {
        user: true,
        house: {
          include: {
            building: true,
          },
        },
        householdGroup: true,
      },
    });

    if (!relation) {
      throw new BusinessException(
        AppErrorCode.MEMBER_NOT_FOUND,
        'Member relation not found',
        HttpStatus.NOT_FOUND,
      );
    }

    return this.mapMemberDetail(relation);
  }

  async listAdmin(query: AdminMemberListQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const skip = (page - 1) * pageSize;

    const andWhere: any[] = [];

    if (query.keyword?.trim()) {
      const keyword = query.keyword.trim();
      andWhere.push({
        OR: [
          { user: { realName: { contains: keyword } } },
          { user: { nickname: { contains: keyword } } },
          { user: { mobile: { contains: keyword } } },
          { house: { displayName: { contains: keyword } } },
        ],
      });
    }

    if (query.status?.trim()) {
      andWhere.push({ status: query.status.trim() });
    }

    if (query.relationType?.trim()) {
      andWhere.push({ relationType: query.relationType.trim() });
    }

    if (query.houseId?.trim()) {
      andWhere.push({ houseId: query.houseId.trim() });
    }

    const where = andWhere.length > 0 ? { AND: andWhere } : undefined;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.houseMemberRelation.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          user: true,
          house: {
            include: {
              building: true,
            },
          },
          householdGroup: true,
        },
      }),
      this.prisma.houseMemberRelation.count({ where }),
    ]);

    return {
      items: items.map((item) => this.mapMemberListItem(item)),
      total,
      page,
      pageSize,
    };
  }

  async getAdminDetail(id: string) {
    const relation = await this.prisma.houseMemberRelation.findUnique({
      where: { id },
      include: {
        user: true,
        house: {
          include: {
            building: true,
          },
        },
        householdGroup: true,
      },
    });

    if (!relation) {
      throw new BusinessException(
        AppErrorCode.MEMBER_NOT_FOUND,
        'Member relation not found',
        HttpStatus.NOT_FOUND,
      );
    }

    return this.mapMemberDetail(relation);
  }

  async createAdmin(dto: CreateAdminMemberDto, context?: AdminAuditContext) {
    await this.ensureMemberDependencies(dto.userId, dto.houseId, dto.householdGroupId);
    await this.ensurePrimaryRoleConstraint(
      dto.relationType,
      dto.isPrimaryRole ?? false,
    );

    const relation = await this.prisma.$transaction(async (tx) => {
      if (dto.isPrimaryRole) {
        await tx.houseMemberRelation.updateMany({
          where: {
            houseId: dto.houseId,
            isPrimaryRole: true,
          },
          data: {
            isPrimaryRole: false,
          },
        });
      }

      return tx.houseMemberRelation.create({
        data: {
          userId: dto.userId,
          houseId: dto.houseId,
          householdGroupId: dto.householdGroupId,
          relationType: dto.relationType as any,
          relationLabel: dto.relationLabel ?? null,
          isPrimaryRole: dto.isPrimaryRole ?? false,
          canViewBill: dto.canViewBill ?? false,
          canPayBill: dto.canPayBill ?? false,
          canActAsAgent: dto.canActAsAgent ?? false,
          canJoinConsultation: dto.canJoinConsultation ?? false,
          canBeVoteDelegate: dto.canBeVoteDelegate ?? false,
          status: (dto.status as any) ?? 'ACTIVE',
          effectiveAt: dto.effectiveAt ? new Date(dto.effectiveAt) : new Date(),
          expiredAt: dto.expiredAt ? new Date(dto.expiredAt) : null,
        },
      });
    });

    const created = await this.getAdminDetail(relation.id);
    await this.auditLogService.recordAdminAction({
      context,
      action: 'CREATE',
      resourceType: 'MEMBER',
      resourceId: relation.id,
      resourceName: `${created.userName} / ${created.houseDisplayName}`,
      snapshot: { after: created },
    });

    return created;
  }

  async updateAdmin(id: string, dto: UpdateAdminMemberDto, context?: AdminAuditContext) {
    const before = await this.getAdminDetail(id);
    const current = {
      id: before.id,
      userId: before.userId,
      houseId: before.houseId,
      householdGroupId: before.householdGroupId,
      relationType: before.relationType,
    };

    await this.ensureMemberDependencies(
      dto.userId ?? current.userId,
      dto.houseId ?? current.houseId,
      dto.householdGroupId ?? current.householdGroupId,
    );

    await this.ensurePrimaryRoleConstraint(
      dto.relationType ?? current.relationType,
      dto.isPrimaryRole ?? false,
    );

    await this.prisma.$transaction(async (tx) => {
      if (dto.isPrimaryRole) {
        await tx.houseMemberRelation.updateMany({
          where: {
            houseId: dto.houseId ?? current.houseId,
            isPrimaryRole: true,
            NOT: {
              id,
            },
          },
          data: {
            isPrimaryRole: false,
          },
        });
      }

      await tx.houseMemberRelation.update({
        where: { id },
        data: {
          ...(dto.userId ? { userId: dto.userId } : {}),
          ...(dto.houseId ? { houseId: dto.houseId } : {}),
          ...(dto.householdGroupId ? { householdGroupId: dto.householdGroupId } : {}),
          ...(dto.relationType ? { relationType: dto.relationType as any } : {}),
          ...(dto.relationLabel !== undefined ? { relationLabel: dto.relationLabel || null } : {}),
          ...(dto.isPrimaryRole !== undefined ? { isPrimaryRole: dto.isPrimaryRole } : {}),
          ...(dto.canViewBill !== undefined ? { canViewBill: dto.canViewBill } : {}),
          ...(dto.canPayBill !== undefined ? { canPayBill: dto.canPayBill } : {}),
          ...(dto.canActAsAgent !== undefined ? { canActAsAgent: dto.canActAsAgent } : {}),
          ...(dto.canJoinConsultation !== undefined
            ? { canJoinConsultation: dto.canJoinConsultation }
            : {}),
          ...(dto.canBeVoteDelegate !== undefined
            ? { canBeVoteDelegate: dto.canBeVoteDelegate }
            : {}),
          ...(dto.status ? { status: dto.status as any } : {}),
          ...(dto.effectiveAt !== undefined
            ? { effectiveAt: dto.effectiveAt ? new Date(dto.effectiveAt) : new Date() }
            : {}),
          ...(dto.expiredAt !== undefined
            ? { expiredAt: dto.expiredAt ? new Date(dto.expiredAt) : null }
            : {}),
        },
      });
    });

    const updated = await this.getAdminDetail(id);
    await this.auditLogService.recordAdminAction({
      context,
      action: 'UPDATE',
      resourceType: 'MEMBER',
      resourceId: id,
      resourceName: `${updated.userName} / ${updated.houseDisplayName}`,
      snapshot: { before, after: updated },
    });

    return updated;
  }

  async removeAdmin(id: string, context?: AdminAuditContext) {
    const before = await this.getAdminDetail(id);

    await this.prisma.houseMemberRelation.update({
      where: { id },
      data: {
        status: 'REMOVED',
        expiredAt: new Date(),
      },
    });

    await this.auditLogService.recordAdminAction({
      context,
      action: 'DELETE',
      resourceType: 'MEMBER',
      resourceId: id,
      resourceName: `${before.userName} / ${before.houseDisplayName}`,
      snapshot: { before },
    });

    return {
      id,
      removed: true,
    };
  }

  private mapMemberListItem(relation: any) {
    return {
      id: relation.id,
      userId: relation.userId,
      userName: relation.user.realName ?? relation.user.nickname ?? '未命名用户',
      nickname: relation.user.nickname,
      mobile: relation.user.mobile,
      buildingName: relation.house.building.buildingName,
      houseId: relation.houseId,
      houseDisplayName: relation.house.displayName,
      householdGroupId: relation.householdGroupId,
      householdType: householdGroupLabelMap[relation.householdGroup.groupType] ?? relation.householdGroup.groupType,
      relationType: relation.relationType,
      relationLabel: memberRelationLabelMap[relation.relationType] ?? relation.relationType,
      isPrimaryRole: relation.isPrimaryRole,
      status: relation.status,
      effectiveAt: relation.effectiveAt,
      expiredAt: relation.expiredAt,
    };
  }

  private mapMemberDetail(relation: any) {
    return {
      ...this.mapMemberListItem(relation),
      canViewBill: relation.canViewBill,
      canPayBill: relation.canPayBill,
      canActAsAgent: relation.canActAsAgent,
      canJoinConsultation: relation.canJoinConsultation,
      canBeVoteDelegate: relation.canBeVoteDelegate,
      userStatus: relation.user.status,
      mobileVerifiedAt: relation.user.mobileVerifiedAt,
      createdAt: relation.createdAt,
      updatedAt: relation.updatedAt,
    };
  }

  private async ensureMemberDependencies(
    userId: string,
    houseId: string,
    householdGroupId: string,
  ) {
    const [user, house, householdGroup] = await this.prisma.$transaction([
      this.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true },
      }),
      this.prisma.house.findUnique({
        where: { id: houseId },
        select: { id: true },
      }),
      this.prisma.householdGroup.findFirst({
        where: {
          id: householdGroupId,
          houseId,
        },
        select: { id: true },
      }),
    ]);

    if (!user || !house || !householdGroup) {
      throw new BusinessException(
        AppErrorCode.INVALID_OPERATION,
        'User, house, or household group is invalid',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  private async ensurePrimaryRoleConstraint(
    relationType: string,
    isPrimaryRole: boolean,
  ) {
    if (
      isPrimaryRole &&
      relationType !== 'MAIN_OWNER' &&
      relationType !== 'MAIN_TENANT'
    ) {
      throw new BusinessException(
        AppErrorCode.INVALID_OPERATION,
        'Primary role must be MAIN_OWNER or MAIN_TENANT',
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
