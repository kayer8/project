import { HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BusinessException } from '../../common/exceptions/business.exception';
import { AppErrorCode } from '../../common/exceptions/app-error-code';
import { AuditLogService } from '../audit-log/audit-log.service';
import { AdminAuditContext } from '../audit-log/audit-log.types';
import {
  AdminUserListQueryDto,
  CreateAdminUserDto,
  UpdateAdminUserDto,
} from './dto/user.dto';
import { AdminOwnerListQueryDto } from './dto/owner.dto';

const memberRelationLabelMap: Record<string, string> = {
  MAIN_OWNER: '主业主',
  FAMILY_MEMBER: '家庭成员',
  MAIN_TENANT: '主租户',
  CO_RESIDENT: '同住成员',
  AGENT: '代办人',
};

const communityRoleLabelMap: Record<string, string> = {
  COMMITTEE_MEMBER: '委员会成员',
  BUILDING_LEADER: '楼栋负责人',
  VOLUNTEER: '志愿者',
};

const householdGroupLabelMap: Record<string, string> = {
  OWNER_HOUSEHOLD: '业主住户组',
  TENANT_HOUSEHOLD: '租户住户组',
  CO_LIVING_HOUSEHOLD: '合住住户组',
};

const ownerAuthStatusLabelMap: Record<string, string> = {
  VERIFIED: '已认证',
  SUPPLEMENT_REQUIRED: '待补充材料',
  INVALID: '已失效',
};

const voteQualificationLabelMap: Record<string, string> = {
  QUALIFIED: '有资格',
  NEEDS_AUTHORIZATION: '需授权',
  UNQUALIFIED: '无资格',
};

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogService: AuditLogService,
  ) {}

  async getById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        communityRoles: {
          include: {
            community: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        memberRelations: {
          include: {
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
        },
        identityApplications: {
          include: {
            house: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        registrationRequests: {
          include: {
            building: true,
            house: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
        },
      },
    });

    if (!user) {
      throw new BusinessException(
        AppErrorCode.USER_NOT_FOUND,
        'User not found',
        HttpStatus.NOT_FOUND,
      );
    }

    return this.mapUserDetail(user);
  }

  async listAdmin(query: AdminUserListQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const skip = (page - 1) * pageSize;

    const andWhere: any[] = [];

    if (query.keyword?.trim()) {
      const keyword = query.keyword.trim();
      andWhere.push({
        OR: [
          { realName: { contains: keyword } },
          { nickname: { contains: keyword } },
          { mobile: { contains: keyword } },
          { wechatOpenid: { contains: keyword } },
        ],
      });
    }

    if (query.status?.trim()) {
      andWhere.push({
        status: query.status.trim(),
      });
    }

    if (query.communityId?.trim()) {
      const communityId = query.communityId.trim();
      andWhere.push({
        OR: [
          {
            communityRoles: {
              some: {
                communityId,
              },
            },
          },
        ],
      });
    }

    const where = andWhere.length > 0 ? { AND: andWhere } : undefined;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          communityRoles: {
            include: {
              community: true,
            },
          },
          memberRelations: {
            where: {
              status: {
                in: ['ACTIVE', 'PENDING'],
              },
            },
            include: {
              house: {
                include: {
                  building: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      items: items.map((item) => this.mapUserListItem(item)),
      total,
      page,
      pageSize,
    };
  }

  async listOwnersAdmin(query: AdminOwnerListQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const andWhere: any[] = [
      {
        householdGroup: {
          groupType: 'OWNER_HOUSEHOLD',
          status: 'ACTIVE',
        },
      },
    ];

    if (query.keyword?.trim()) {
      const keyword = query.keyword.trim();
      andWhere.push({
        OR: [
          { user: { realName: { contains: keyword } } },
          { user: { nickname: { contains: keyword } } },
          { user: { mobile: { contains: keyword } } },
          { house: { displayName: { contains: keyword } } },
          { house: { building: { buildingName: { contains: keyword } } } },
        ],
      });
    }

    if (query.buildingId?.trim()) {
      andWhere.push({
        house: {
          buildingId: query.buildingId.trim(),
        },
      });
    }

    const where = andWhere.length > 0 ? { AND: andWhere } : undefined;

    const relations = await this.prisma.houseMemberRelation.findMany({
      where,
      orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
      include: {
        user: {
          include: {
            identityApplications: {
              orderBy: {
                createdAt: 'desc',
              },
            },
            registrationRequests: {
              include: {
                building: true,
                house: true,
              },
              orderBy: {
                createdAt: 'desc',
              },
              take: 1,
            },
          },
        },
        house: {
          include: {
            building: true,
          },
        },
        householdGroup: true,
      },
    });

    let items = relations.map((item) => this.mapOwnerListItem(item));

    if (query.authStatus?.trim()) {
      items = items.filter((item) => item.authStatus === query.authStatus?.trim());
    }

    if (query.voteQualification?.trim()) {
      items = items.filter(
        (item) => item.voteQualification === query.voteQualification?.trim(),
      );
    }

    const total = items.length;
    const start = (page - 1) * pageSize;

    return {
      items: items.slice(start, start + pageSize),
      total,
      page,
      pageSize,
    };
  }

  findByWechatOpenid(wechatOpenid: string) {
    return this.prisma.user.findUnique({
      where: { wechatOpenid },
    });
  }

  findByMobile(mobile: string) {
    return this.prisma.user.findUnique({
      where: { mobile },
    });
  }

  async createAdmin(dto: CreateAdminUserDto, context?: AdminAuditContext) {
    const user = await this.prisma.user.create({
      data: {
        wechatOpenid: dto.wechatOpenid,
        wechatUnionid: dto.wechatUnionid ?? null,
        nickname: dto.nickname ?? '未命名用户',
        realName: dto.realName ?? null,
        mobile: dto.mobile ?? null,
        avatarUrl: dto.avatarUrl ?? null,
        status: (dto.status as any) ?? 'ACTIVE',
      },
    });

    const created = await this.getById(user.id);
    await this.auditLogService.recordAdminAction({
      context,
      action: 'CREATE',
      resourceType: 'USER',
      resourceId: user.id,
      resourceName: created.realName || created.nickname || created.mobile || created.wechatOpenid,
      snapshot: { after: created },
    });

    return created;
  }

  async updateAdmin(id: string, dto: UpdateAdminUserDto, context?: AdminAuditContext) {
    const before = await this.getById(id);

    await this.prisma.user.update({
      where: { id },
      data: {
        ...(dto.wechatOpenid ? { wechatOpenid: dto.wechatOpenid } : {}),
        ...(dto.wechatUnionid !== undefined ? { wechatUnionid: dto.wechatUnionid || null } : {}),
        ...(dto.nickname !== undefined ? { nickname: dto.nickname || null } : {}),
        ...(dto.realName !== undefined ? { realName: dto.realName || null } : {}),
        ...(dto.mobile !== undefined ? { mobile: dto.mobile || null } : {}),
        ...(dto.avatarUrl !== undefined ? { avatarUrl: dto.avatarUrl || null } : {}),
        ...(dto.status ? { status: dto.status as any } : {}),
      },
    });

    const updated = await this.getById(id);
    await this.auditLogService.recordAdminAction({
      context,
      action: 'UPDATE',
      resourceType: 'USER',
      resourceId: id,
      resourceName: updated.realName || updated.nickname || updated.mobile || updated.wechatOpenid,
      snapshot: { before, after: updated },
    });

    return updated;
  }

  async removeAdmin(id: string, context?: AdminAuditContext) {
    const before = await this.getById(id);

    await this.prisma.user.update({
      where: { id },
      data: {
        status: 'DELETED',
        deletedAt: new Date(),
      },
    });

    await this.auditLogService.recordAdminAction({
      context,
      action: 'DELETE',
      resourceType: 'USER',
      resourceId: id,
      resourceName: before.realName || before.nickname || before.mobile || before.wechatOpenid,
      snapshot: { before },
    });

    return {
      id,
      removed: true,
    };
  }

  createWeChatUser(params: {
    wechatOpenid: string;
    wechatUnionid?: string;
    nickname?: string;
    avatarUrl?: string;
    mobile?: string;
    realName?: string;
  }) {
    return this.prisma.user.create({
      data: {
        wechatOpenid: params.wechatOpenid,
        wechatUnionid: params.wechatUnionid ?? null,
        nickname: params.nickname ?? '未命名用户',
        avatarUrl: params.avatarUrl ?? null,
        mobile: params.mobile ?? null,
        realName: params.realName ?? null,
        ...(params.mobile ? { mobileVerifiedAt: new Date() } : {}),
      },
    });
  }

  updateWeChatProfile(
    userId: string,
    updates: {
      wechatOpenid?: string;
      wechatUnionid?: string | null;
      nickname?: string;
      avatarUrl?: string;
      mobile?: string;
      realName?: string;
    },
  ) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(updates.wechatOpenid ? { wechatOpenid: updates.wechatOpenid } : {}),
        ...(updates.wechatUnionid !== undefined
          ? { wechatUnionid: updates.wechatUnionid || null }
          : {}),
        ...(updates.nickname ? { nickname: updates.nickname } : {}),
        ...(updates.avatarUrl ? { avatarUrl: updates.avatarUrl } : {}),
        ...(updates.mobile ? { mobile: updates.mobile, mobileVerifiedAt: new Date() } : {}),
        ...(updates.realName !== undefined ? { realName: updates.realName || null } : {}),
      },
    });
  }

  private async ensureUserExists(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!user) {
      throw new BusinessException(
        AppErrorCode.USER_NOT_FOUND,
        'User not found',
        HttpStatus.NOT_FOUND,
      );
    }
  }

  private mapUserListItem(user: any) {
    const activeRelation =
      user.memberRelations.find((item: any) => item.isPrimaryRole) ??
      user.memberRelations[0];
    const communityNames = Array.from(
      new Set([
        ...user.communityRoles.map((item: any) => item.community.name),
      ]),
    );

    return {
      id: user.id,
      realName: user.realName ?? '未实名',
      nickname: user.nickname ?? '未命名用户',
      avatarUrl: user.avatarUrl ?? null,
      mobile: user.mobile,
      status: user.status,
      registerSource: user.registerSource,
      communityNames,
      houseCount: user.memberRelations.length,
      primaryRoleLabel: activeRelation
        ? memberRelationLabelMap[activeRelation.relationType] ?? activeRelation.relationType
        : '未绑定房屋',
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
    };
  }

  private mapUserDetail(user: any) {
    const listItem = this.mapUserListItem(user);
    const latestRegistrationRequest = user.registrationRequests?.[0] ?? null;
    const residentStatus = user.memberRelations.some((item: any) => item.status === 'ACTIVE')
      ? 'SYNCED'
      : latestRegistrationRequest?.status === 'PENDING'
        ? 'UNVERIFIED'
        : latestRegistrationRequest?.status === 'REJECTED'
          ? 'REJECTED'
        : 'REGISTERED';

    return {
      ...listItem,
      wechatOpenid: user.wechatOpenid,
      wechatUnionid: user.wechatUnionid,
      avatarUrl: user.avatarUrl ?? null,
      mobileVerifiedAt: user.mobileVerifiedAt,
      deletedAt: user.deletedAt,
      communityRoles: user.communityRoles.map((item: any) => ({
        communityId: item.communityId,
        communityName: item.community.name,
        roleType: item.roleType,
        roleLabel: communityRoleLabelMap[item.roleType] ?? item.roleType,
        status: item.status,
        effectiveAt: item.effectiveAt,
        expiredAt: item.expiredAt,
      })),
      houseRelations: user.memberRelations.map((item: any) => ({
        id: item.id,
        houseId: item.houseId,
        houseDisplayName: item.house.displayName,
        buildingName: item.house.building.buildingName,
        householdGroupId: item.householdGroupId,
        householdType: householdGroupLabelMap[item.householdGroup.groupType] ?? item.householdGroup.groupType,
        relationType: item.relationType,
        relationLabel: memberRelationLabelMap[item.relationType] ?? item.relationType,
        isPrimaryRole: item.isPrimaryRole,
        canViewBill: item.canViewBill,
        canPayBill: item.canPayBill,
        canActAsAgent: item.canActAsAgent,
        canJoinConsultation: item.canJoinConsultation,
        canBeVoteDelegate: item.canBeVoteDelegate,
        status: item.status,
        effectiveAt: item.effectiveAt,
        expiredAt: item.expiredAt,
      })),
      identityApplications: user.identityApplications.map((item: any) => ({
        id: item.id,
        applicationType: item.applicationType,
        status: item.status,
        houseId: item.houseId,
        houseDisplayName: item.house?.displayName ?? null,
        submittedAt: item.createdAt,
        reviewedAt: item.reviewedAt,
        rejectReason: item.rejectReason,
      })),
      residentStatus,
      latestRegistrationRequest: latestRegistrationRequest
        ? {
            id: latestRegistrationRequest.id,
            mobile: latestRegistrationRequest.mobile,
            status: latestRegistrationRequest.status,
            buildingId: latestRegistrationRequest.buildingId,
            buildingName: latestRegistrationRequest.building?.buildingName ?? null,
            houseId: latestRegistrationRequest.houseId,
            houseDisplayName: latestRegistrationRequest.house?.displayName ?? null,
            reviewNote: latestRegistrationRequest.reviewNote,
            submittedAt: latestRegistrationRequest.submittedAt,
          }
        : null,
    };
  }

  private mapOwnerListItem(relation: any) {
    const latestIdentityApplication =
      relation.user.identityApplications.find((item: any) =>
        ['OWNER_VERIFY', 'TENANT_VERIFY'].includes(item.applicationType),
      ) ?? null;
    const latestRegistrationRequest = relation.user.registrationRequests?.[0] ?? null;
    const authStatus = this.resolveOwnerAuthStatus(
      relation,
      latestIdentityApplication,
      latestRegistrationRequest,
    );
    const voteQualification = this.resolveVoteQualification(relation);

    return {
      id: relation.id,
      userId: relation.userId,
      name: relation.user.realName ?? relation.user.nickname ?? '未实名用户',
      mobile: relation.user.mobile ?? '-',
      houseId: relation.houseId,
      house: relation.house.displayName,
      buildingId: relation.house.buildingId,
      buildingName: relation.house.building.buildingName,
      identity: memberRelationLabelMap[relation.relationType] ?? relation.relationType,
      authStatus,
      authStatusLabel: ownerAuthStatusLabelMap[authStatus] ?? authStatus,
      voteQualification,
      voteQualificationLabel:
        voteQualificationLabelMap[voteQualification] ?? voteQualification,
      updatedAt: relation.updatedAt,
    };
  }

  private resolveOwnerAuthStatus(
    relation: any,
    latestIdentityApplication: any,
    latestRegistrationRequest: any,
  ) {
    if (latestIdentityApplication?.status === 'SUPPLEMENT_REQUIRED') {
      return 'SUPPLEMENT_REQUIRED';
    }

    if (
      ['REJECTED', 'WITHDRAWN'].includes(latestIdentityApplication?.status) ||
      ['REJECTED', 'INACTIVE', 'EXPIRED', 'REMOVED'].includes(relation.status)
    ) {
      return 'INVALID';
    }

    if (relation.status === 'PENDING' || latestRegistrationRequest?.status === 'PENDING') {
      return 'SUPPLEMENT_REQUIRED';
    }

    return 'VERIFIED';
  }

  private resolveVoteQualification(relation: any) {
    if (relation.status !== 'ACTIVE') {
      return 'UNQUALIFIED';
    }

    if (relation.relationType === 'MAIN_OWNER') {
      return 'QUALIFIED';
    }

    if (
      relation.canBeVoteDelegate ||
      relation.canActAsAgent ||
      ['FAMILY_MEMBER', 'AGENT'].includes(relation.relationType)
    ) {
      return 'NEEDS_AUTHORIZATION';
    }

    return 'UNQUALIFIED';
  }
}
