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
import {
  AdminOwnerReviewListQueryDto,
  ReviewOwnerRequestDto,
} from './dto/owner-review.dto';

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

const ownerReviewStatusLabelMap: Record<string, string> = {
  PENDING: '待审核',
  REVIEWED: '已通过',
  REJECTED: '已拒绝',
  CANCELLED: '已取消',
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
            community: true,
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

  async listOwnerReviewsAdmin(query: AdminOwnerReviewListQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const skip = (page - 1) * pageSize;
    const andWhere: any[] = [];

    if (query.keyword?.trim()) {
      const keyword = query.keyword.trim();
      andWhere.push({
        OR: [
          { mobile: { contains: keyword } },
          { user: { realName: { contains: keyword } } },
          { user: { nickname: { contains: keyword } } },
          { house: { displayName: { contains: keyword } } },
          { building: { buildingName: { contains: keyword } } },
        ],
      });
    }

    if (query.buildingId?.trim()) {
      andWhere.push({
        buildingId: query.buildingId.trim(),
      });
    }

    if (query.status?.trim()) {
      andWhere.push({
        status: query.status.trim(),
      });
    }

    const where = andWhere.length > 0 ? { AND: andWhere } : undefined;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.registrationRequest.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: [{ submittedAt: 'desc' }, { createdAt: 'desc' }],
        include: {
          user: true,
          building: true,
          house: true,
        },
      }),
      this.prisma.registrationRequest.count({ where }),
    ]);

    return {
      items: items.map((item) => this.mapOwnerReviewListItem(item)),
      total,
      page,
      pageSize,
    };
  }

  async reviewOwnerRequestAdmin(
    id: string,
    dto: ReviewOwnerRequestDto,
    context?: AdminAuditContext,
  ) {
    const reviewNote = dto.reviewNote?.trim() || null;
    const before = await this.prisma.registrationRequest.findUnique({
      where: { id },
      include: {
        user: true,
        building: true,
        house: true,
      },
    });

    if (!before) {
      throw new BusinessException(
        AppErrorCode.INVALID_OPERATION,
        'Registration request not found',
        HttpStatus.NOT_FOUND,
      );
    }

    if (before.status !== 'PENDING') {
      throw new BusinessException(
        AppErrorCode.INVALID_OPERATION,
        'Only pending requests can be reviewed',
        HttpStatus.BAD_REQUEST,
      );
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      if (dto.status === 'REJECTED') {
        return tx.registrationRequest.update({
          where: { id },
          data: {
            status: 'REJECTED',
            reviewNote,
          },
          include: {
            user: true,
            building: true,
            house: true,
          },
        });
      }

      if (!before.houseId) {
        throw new BusinessException(
          AppErrorCode.INVALID_OPERATION,
          'The request has no selected house',
          HttpStatus.BAD_REQUEST,
        );
      }

      const house = await tx.house.findUnique({
        where: { id: before.houseId },
        include: {
          householdGroups: {
            where: { status: 'ACTIVE' },
            orderBy: { startedAt: 'desc' },
          },
          residentArchives: {
            where: {
              mobile: before.mobile,
              status: {
                in: ['ACTIVE', 'SYNCED'],
              },
            },
            orderBy: [{ matchedAt: 'desc' }, { createdAt: 'asc' }],
          },
        },
      });

      if (!house || house.buildingId !== before.buildingId) {
        throw new BusinessException(
          AppErrorCode.HOUSE_NOT_FOUND,
          'House not found',
          HttpStatus.BAD_REQUEST,
        );
      }

      const archive = house.residentArchives[0] ?? null;
      const desiredRelationType = archive?.relationType ?? 'MAIN_OWNER';
      const wantsPrimaryRole =
        desiredRelationType === 'MAIN_OWNER' || desiredRelationType === 'MAIN_TENANT';
      const defaultGroupType =
        desiredRelationType === 'MAIN_TENANT' ? 'TENANT_HOUSEHOLD' : 'OWNER_HOUSEHOLD';
      const householdGroup =
        house.householdGroups[0] ??
        (await tx.householdGroup.create({
          data: {
            houseId: house.id,
            groupType: defaultGroupType as any,
            status: 'ACTIVE',
            remark: 'Created from admin review approval',
          },
        }));

      const existingPrimary = wantsPrimaryRole
        ? await tx.houseMemberRelation.findFirst({
            where: {
              houseId: house.id,
              userId: {
                not: before.userId,
              },
              isPrimaryRole: true,
              status: 'ACTIVE',
            },
            select: {
              id: true,
            },
          })
        : null;

      const existingRelation = await tx.houseMemberRelation.findFirst({
        where: {
          houseId: house.id,
          userId: before.userId,
        },
        orderBy: {
          createdAt: 'desc',
        },
        select: {
          id: true,
        },
      });

      const relationPayload = {
        householdGroupId: householdGroup.id,
        relationType: desiredRelationType as any,
        relationLabel: archive?.relationLabel ?? null,
        isPrimaryRole: wantsPrimaryRole && !existingPrimary,
        canViewBill: true,
        canPayBill: true,
        canActAsAgent: wantsPrimaryRole,
        canJoinConsultation: true,
        canBeVoteDelegate: wantsPrimaryRole,
        status: 'ACTIVE' as any,
        effectiveAt: new Date(),
        expiredAt: null,
      };

      if (existingRelation) {
        await tx.houseMemberRelation.update({
          where: {
            id: existingRelation.id,
          },
          data: relationPayload,
        });
      } else {
        await tx.houseMemberRelation.create({
          data: {
            houseId: house.id,
            userId: before.userId,
            ...relationPayload,
          },
        });
      }

      await tx.user.update({
        where: { id: before.userId },
        data: {
          mobile: before.mobile,
          mobileVerifiedAt: new Date(),
        },
      });

      if (archive) {
        await tx.residentArchive.update({
          where: { id: archive.id },
          data: {
            status: 'SYNCED',
            matchedUserId: before.userId,
            matchedAt: new Date(),
          },
        });
      }

      return tx.registrationRequest.update({
        where: { id },
        data: {
          status: 'REVIEWED',
          reviewNote,
        },
        include: {
          user: true,
          building: true,
          house: true,
        },
      });
    });

    await this.auditLogService.recordAdminAction({
      context,
      action: dto.status === 'REVIEWED' ? 'APPROVE' : 'REJECT',
      resourceType: 'OWNER_REVIEW',
      resourceId: updated.id,
      resourceName: `${updated.user?.realName ?? updated.user?.nickname ?? updated.mobile} / ${updated.house?.displayName ?? updated.building?.buildingName ?? updated.id}`,
      snapshot: {
        before: this.mapOwnerReviewListItem(before),
        after: this.mapOwnerReviewListItem(updated),
      },
    });

    return this.mapOwnerReviewListItem(updated);
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

  private async mapUserDetail(user: any) {
    const listItem = this.mapUserListItem(user);
    const latestRegistrationRequest = user.registrationRequests?.[0] ?? null;
    const residentStatus = user.memberRelations.some((item: any) => item.status === 'ACTIVE')
      ? 'SYNCED'
      : latestRegistrationRequest?.status === 'PENDING'
        ? 'UNVERIFIED'
        : latestRegistrationRequest?.status === 'REJECTED'
          ? 'REJECTED'
          : 'REGISTERED';
    const currentHouseProfile = await this.buildCurrentHouseProfile(user);

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
      currentHouseProfile,
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

  private async buildCurrentHouseProfile(user: any) {
    const activeRelations = [...(user.memberRelations ?? [])]
      .filter((item: any) => item.status === 'ACTIVE')
      .sort((left: any, right: any) => {
        if (left.isPrimaryRole !== right.isPrimaryRole) {
          return left.isPrimaryRole ? -1 : 1;
        }

        return (
          new Date(right.updatedAt).getTime() -
          new Date(left.updatedAt).getTime()
        );
      });
    const currentRelation = activeRelations[0] ?? null;
    const communityName = this.resolveCurrentCommunityName(user);

    if (!currentRelation) {
      return {
        communityName,
        houseId: null,
        houseDisplayName: null,
        buildingId: null,
        buildingName: null,
        relationType: null,
        relationStatus: null,
        isPrimaryRole: false,
        memberCount: 0,
        canViewBill: false,
        canPayBill: false,
        canJoinConsultation: false,
        canBeVoteDelegate: false,
        paymentSummary: null,
      };
    }

    const memberCount = await this.prisma.houseMemberRelation.count({
      where: {
        houseId: currentRelation.houseId,
        status: 'ACTIVE',
      },
    });
    const paymentSummary = await this.getCurrentHousePaymentSummary(
      activeRelations.map((item: any) => item.houseId),
      currentRelation.houseId,
    );

    return {
      communityName,
      houseId: currentRelation.houseId,
      houseDisplayName: currentRelation.house.displayName,
      buildingId: currentRelation.house.buildingId,
      buildingName: currentRelation.house.building.buildingName,
      relationType: currentRelation.relationType,
      relationStatus: currentRelation.status,
      isPrimaryRole: currentRelation.isPrimaryRole,
      memberCount,
      canViewBill: currentRelation.canViewBill,
      canPayBill: currentRelation.canPayBill,
      canJoinConsultation: currentRelation.canJoinConsultation,
      canBeVoteDelegate: currentRelation.canBeVoteDelegate,
      paymentSummary,
    };
  }

  private async getCurrentHousePaymentSummary(boundHouseIds: string[], currentHouseId: string) {
    const uniqueHouseIds = Array.from(new Set(boundHouseIds.filter(Boolean)));
    if (!uniqueHouseIds.length) {
      return null;
    }

    const now = new Date();
    const records = await this.prisma.managementFeeRecord.findMany({
      where: {
        houseId: {
          in: uniqueHouseIds,
        },
        paymentStatus: {
          not: 'PAID',
        },
        OR: [
          {
            dueDate: null,
          },
          {
            dueDate: {
              gte: now,
            },
          },
        ],
      },
      select: {
        houseId: true,
      },
    });

    const unpaidCountByHouse = new Map<string, number>();
    records.forEach((item) => {
      unpaidCountByHouse.set(item.houseId, (unpaidCountByHouse.get(item.houseId) ?? 0) + 1);
    });

    const currentHouseUnpaidCount = unpaidCountByHouse.get(currentHouseId) ?? 0;
    const otherHouseUnpaidCount = Array.from(unpaidCountByHouse.entries()).reduce((sum, [houseId, count]) => {
      if (houseId === currentHouseId) {
        return sum;
      }

      return sum + count;
    }, 0);
    const otherHouseCountWithUnpaid = Array.from(unpaidCountByHouse.keys()).filter(
      (houseId) => houseId !== currentHouseId,
    ).length;

    return {
      currentHouseUnpaidCount,
      otherHouseUnpaidCount,
      otherHouseCountWithUnpaid,
      totalUnpaidCount: records.length,
      hasCurrentHouseUnpaid: currentHouseUnpaidCount > 0,
      hasOtherHouseUnpaid: otherHouseUnpaidCount > 0,
    };
  }

  private resolveCurrentCommunityName(user: any) {
    const activeCommunityRole = (user.communityRoles ?? []).find(
      (item: any) => item.status === 'ACTIVE' && item.community?.name,
    );

    if (activeCommunityRole?.community?.name) {
      return activeCommunityRole.community.name;
    }

    const latestIdentityCommunity = (user.identityApplications ?? []).find(
      (item: any) => item.community?.name,
    );

    return latestIdentityCommunity?.community?.name ?? null;
  }

  private mapOwnerReviewListItem(request: any) {
    return {
      id: request.id,
      userId: request.userId,
      name: request.user?.realName ?? request.user?.nickname ?? '未实名用户',
      mobile: request.mobile,
      buildingId: request.buildingId,
      buildingName: request.building?.buildingName ?? '-',
      houseId: request.houseId ?? null,
      house: request.house?.displayName ?? '未选择房屋',
      roleLabel: '房屋绑定',
      status: request.status,
      statusLabel: ownerReviewStatusLabelMap[request.status] ?? request.status,
      reviewNote: request.reviewNote ?? null,
      submittedAt: request.submittedAt,
      updatedAt: request.updatedAt,
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
