import { HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BusinessException } from '../../common/exceptions/business.exception';
import { AppErrorCode } from '../../common/exceptions/app-error-code';
import { AuditLogService } from '../audit-log/audit-log.service';
import { AdminAuditContext } from '../audit-log/audit-log.types';
import {
  AdminHouseListQueryDto,
  CreateAdminHouseArchiveDto,
  CreateAdminHouseDto,
  UpdateAdminHouseArchiveDto,
  UpdateAdminHouseDto,
} from './dto/house.dto';

const householdGroupLabelMap: Record<string, string> = {
  OWNER_HOUSEHOLD: '业主住户组',
  TENANT_HOUSEHOLD: '租户住户组',
  CO_LIVING_HOUSEHOLD: '合住住户组',
};

const memberRelationLabelMap: Record<string, string> = {
  MAIN_OWNER: '主业主',
  FAMILY_MEMBER: '家庭成员',
  MAIN_TENANT: '主租户',
  CO_RESIDENT: '同住成员',
  AGENT: '代办人',
};

@Injectable()
export class HouseService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogService: AuditLogService,
  ) {}

  async listMine(userId: string) {
    const relations = await this.prisma.houseMemberRelation.findMany({
      where: {
        userId,
        status: {
          in: ['ACTIVE', 'PENDING'],
        },
      },
      include: {
        house: {
          include: {
            building: true,
            householdGroups: {
              where: {
                status: 'ACTIVE',
              },
            },
            _count: {
              select: {
                memberRelations: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return relations.map((item) => ({
      relationId: item.id,
      houseId: item.houseId,
      displayName: item.house.displayName,
      buildingName: item.house.building.buildingName,
      unitNo: item.house.unitNo,
      roomNo: item.house.roomNo,
      houseStatus: item.house.houseStatus,
      relationType: item.relationType,
      relationLabel: memberRelationLabelMap[item.relationType] ?? item.relationType,
      isPrimaryRole: item.isPrimaryRole,
      status: item.status,
      memberCount: item.house._count.memberRelations,
      activeHouseholdType: item.house.householdGroups[0]
        ? householdGroupLabelMap[item.house.householdGroups[0].groupType] ??
          item.house.householdGroups[0].groupType
        : null,
    }));
  }

  async getMineHouse(userId: string, houseId: string) {
    const house = await this.prisma.house.findFirst({
      where: {
        id: houseId,
        memberRelations: {
          some: {
            userId,
            status: {
              in: ['ACTIVE', 'PENDING'],
            },
          },
        },
      },
      include: {
        building: true,
        householdGroups: {
          include: {
            memberRelations: {
              include: {
                user: true,
              },
              orderBy: {
                createdAt: 'asc',
              },
            },
          },
          orderBy: {
            startedAt: 'desc',
          },
        },
        voteRepresentatives: {
          where: {
            status: 'ACTIVE',
          },
          include: {
            representativeRelation: {
              include: {
                user: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!house) {
      throw new BusinessException(
        AppErrorCode.HOUSE_NOT_FOUND,
        'House not found',
        HttpStatus.NOT_FOUND,
      );
    }

    return this.mapHouseDetail(house);
  }

  async listAdmin(query: AdminHouseListQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const skip = (page - 1) * pageSize;

    const andWhere: any[] = [];

    if (query.keyword?.trim()) {
      const keyword = query.keyword.trim();
      andWhere.push({
        OR: [
          { displayName: { contains: keyword } },
          { roomNo: { contains: keyword } },
          { building: { buildingName: { contains: keyword } } },
        ],
      });
    }

    if (query.buildingId?.trim()) {
      andWhere.push({ buildingId: query.buildingId.trim() });
    }

    if (query.houseStatus?.trim()) {
      andWhere.push({ houseStatus: query.houseStatus.trim() });
    }

    const where = andWhere.length > 0 ? { AND: andWhere } : undefined;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.house.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          building: true,
          householdGroups: {
            where: {
              status: 'ACTIVE',
            },
          },
          memberRelations: {
            where: {
              status: {
                in: ['ACTIVE', 'PENDING'],
              },
            },
            include: {
              user: true,
            },
          },
        },
      }),
      this.prisma.house.count({ where }),
    ]);

    return {
      items: items.map((item) => this.mapHouseListItem(item)),
      total,
      page,
      pageSize,
    };
  }

  async getAdminDetail(houseId: string) {
    const house = await this.prisma.house.findUnique({
      where: { id: houseId },
      include: {
        building: true,
        residentArchives: {
          include: {
            matchedUser: true,
          },
          orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
        },
        householdGroups: {
          include: {
            memberRelations: {
              include: {
                user: true,
              },
              orderBy: {
                createdAt: 'asc',
              },
            },
          },
          orderBy: {
            startedAt: 'desc',
          },
        },
        memberRelations: {
          include: {
            user: true,
            householdGroup: true,
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
        voteRepresentatives: {
          include: {
            representativeRelation: {
              include: {
                user: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!house) {
      throw new BusinessException(
        AppErrorCode.HOUSE_NOT_FOUND,
        'House not found',
        HttpStatus.NOT_FOUND,
      );
    }

    return this.mapHouseDetail(house);
  }

  async listArchivesAdmin(houseId: string) {
    await this.ensureHouseExists(houseId);

    const items = await this.prisma.residentArchive.findMany({
      where: {
        houseId,
      },
      include: {
        matchedUser: true,
      },
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    });

    return items.map((item) => this.mapResidentArchiveItem(item));
  }

  async createArchiveAdmin(
    houseId: string,
    dto: CreateAdminHouseArchiveDto,
    context?: AdminAuditContext,
  ) {
    const house = await this.prisma.house.findUnique({
      where: { id: houseId },
      include: {
        building: true,
      },
    });

    if (!house) {
      throw new BusinessException(
        AppErrorCode.HOUSE_NOT_FOUND,
        'House not found',
        HttpStatus.NOT_FOUND,
      );
    }

    const mobile = dto.mobile.trim();
    if (!mobile) {
      throw new BusinessException(
        AppErrorCode.INVALID_OPERATION,
        'Mobile number is required',
        HttpStatus.BAD_REQUEST,
      );
    }

    const duplicate = await this.prisma.residentArchive.findFirst({
      where: {
        houseId,
        mobile,
        status: {
          in: ['ACTIVE', 'SYNCED'],
        },
      },
      select: { id: true },
    });

    if (duplicate) {
      throw new BusinessException(
        AppErrorCode.INVALID_OPERATION,
        'This mobile number is already configured for the current house',
        HttpStatus.BAD_REQUEST,
      );
    }

    const archive = await this.prisma.residentArchive.create({
      data: {
        mobile,
        realName: dto.realName?.trim() || null,
        buildingId: house.buildingId,
        houseId,
        relationType: (dto.relationType?.trim() || 'MAIN_OWNER') as any,
        relationLabel: dto.relationLabel?.trim() || null,
        status: 'ACTIVE',
        remark: dto.remark?.trim() || null,
      },
      include: {
        matchedUser: true,
      },
    });

    await this.auditLogService.recordAdminAction({
      context,
      action: 'CREATE',
      resourceType: 'HOUSE_ARCHIVE',
      resourceId: archive.id,
      resourceName: `${house.displayName} / ${mobile}`,
      snapshot: {
        after: this.mapResidentArchiveItem(archive),
      },
    });

    return this.mapResidentArchiveItem(archive);
  }

  async updateArchiveAdmin(
    houseId: string,
    archiveId: string,
    dto: UpdateAdminHouseArchiveDto,
    context?: AdminAuditContext,
  ) {
    const before = await this.prisma.residentArchive.findFirst({
      where: {
        id: archiveId,
        houseId,
      },
      include: {
        matchedUser: true,
        house: true,
      },
    });

    if (!before) {
      throw new BusinessException(
        AppErrorCode.INVALID_OPERATION,
        'Archive record not found',
        HttpStatus.NOT_FOUND,
      );
    }

    const nextMobile = dto.mobile?.trim() ?? before.mobile;
    if (!nextMobile) {
      throw new BusinessException(
        AppErrorCode.INVALID_OPERATION,
        'Mobile number is required',
        HttpStatus.BAD_REQUEST,
      );
    }

    const duplicate = await this.prisma.residentArchive.findFirst({
      where: {
        id: { not: archiveId },
        houseId,
        mobile: nextMobile,
        status: {
          in: ['ACTIVE', 'SYNCED'],
        },
      },
      select: { id: true },
    });

    if (duplicate) {
      throw new BusinessException(
        AppErrorCode.INVALID_OPERATION,
        'This mobile number is already configured for the current house',
        HttpStatus.BAD_REQUEST,
      );
    }

    const shouldResetMatch =
      (dto.mobile !== undefined && dto.mobile.trim() !== before.mobile) ||
      dto.realName !== undefined ||
      dto.relationType !== undefined ||
      dto.relationLabel !== undefined;

    const updated = await this.prisma.residentArchive.update({
      where: { id: archiveId },
      data: {
        ...(dto.mobile !== undefined ? { mobile: nextMobile } : {}),
        ...(dto.realName !== undefined ? { realName: dto.realName?.trim() || null } : {}),
        ...(dto.relationType !== undefined
          ? { relationType: (dto.relationType?.trim() || 'MAIN_OWNER') as any }
          : {}),
        ...(dto.relationLabel !== undefined
          ? { relationLabel: dto.relationLabel?.trim() || null }
          : {}),
        ...(dto.remark !== undefined ? { remark: dto.remark?.trim() || null } : {}),
        ...(shouldResetMatch
          ? {
              matchedUserId: null,
              matchedAt: null,
              status: 'ACTIVE',
            }
          : {}),
      },
      include: {
        matchedUser: true,
      },
    });

    await this.auditLogService.recordAdminAction({
      context,
      action: 'UPDATE',
      resourceType: 'HOUSE_ARCHIVE',
      resourceId: archiveId,
      resourceName: `${before.house?.displayName ?? before.mobile} / ${updated.mobile}`,
      snapshot: {
        before: this.mapResidentArchiveItem(before),
        after: this.mapResidentArchiveItem(updated),
      },
    });

    return this.mapResidentArchiveItem(updated);
  }

  async removeArchiveAdmin(houseId: string, archiveId: string, context?: AdminAuditContext) {
    const before = await this.prisma.residentArchive.findFirst({
      where: {
        id: archiveId,
        houseId,
      },
      include: {
        matchedUser: true,
        house: true,
      },
    });

    if (!before) {
      throw new BusinessException(
        AppErrorCode.INVALID_OPERATION,
        'Archive record not found',
        HttpStatus.NOT_FOUND,
      );
    }

    const updated = await this.prisma.residentArchive.update({
      where: { id: archiveId },
      data: {
        status: 'DISABLED',
      },
      include: {
        matchedUser: true,
      },
    });

    await this.auditLogService.recordAdminAction({
      context,
      action: 'DELETE',
      resourceType: 'HOUSE_ARCHIVE',
      resourceId: archiveId,
      resourceName: `${before.house?.displayName ?? before.mobile} / ${before.mobile}`,
      snapshot: {
        before: this.mapResidentArchiveItem(before),
        after: this.mapResidentArchiveItem(updated),
      },
    });

    return {
      id: archiveId,
      removed: true,
    };
  }

  async listCommunities() {
    const items = await this.prisma.community.findMany({
      orderBy: {
        name: 'asc',
      },
      select: {
        id: true,
        name: true,
        code: true,
      },
    });

    return items;
  }

  async listBuildings() {
    const items = await this.prisma.building.findMany({
      orderBy: [{ sortNo: 'asc' }, { buildingName: 'asc' }],
      select: {
        id: true,
        buildingName: true,
        buildingCode: true,
        sortNo: true,
        status: true,
      },
    });

    return items;
  }

  async listRegistrationHouses(buildingId: string) {
    await this.ensureBuildingExists(buildingId);

    return this.prisma.house.findMany({
      where: {
        buildingId,
      },
      orderBy: [{ floorNo: 'asc' }, { roomNo: 'asc' }],
      select: {
        id: true,
        buildingId: true,
        displayName: true,
        floorNo: true,
        roomNo: true,
        houseStatus: true,
      },
    });
  }

  async createAdmin(dto: CreateAdminHouseDto, context?: AdminAuditContext) {
    await this.ensureBuildingExists(dto.buildingId);

    const house = await this.prisma.$transaction(async (tx) => {
      const created = await tx.house.create({
        data: {
          buildingId: dto.buildingId,
          unitNo: dto.unitNo ?? '',
          floorNo: dto.floorNo ?? null,
          roomNo: dto.roomNo,
          displayName: dto.displayName,
          houseStatus: (dto.houseStatus as any) ?? 'SELF_OCCUPIED',
          grossArea: dto.grossArea ?? null,
        },
      });

      const defaultGroupType =
        dto.houseStatus === 'RENTED' ? 'TENANT_HOUSEHOLD' : 'OWNER_HOUSEHOLD';

      await tx.householdGroup.create({
        data: {
          houseId: created.id,
          groupType: defaultGroupType as any,
          status: 'ACTIVE',
        },
      });

      return created;
    });

    const created = await this.getAdminDetail(house.id);
    await this.auditLogService.recordAdminAction({
      context,
      action: 'CREATE',
      resourceType: 'HOUSE',
      resourceId: house.id,
      resourceName: created.displayName,
      snapshot: { after: created },
    });

    return created;
  }

  async updateAdmin(id: string, dto: UpdateAdminHouseDto, context?: AdminAuditContext) {
    const before = await this.getAdminDetail(id);

    if (dto.buildingId) {
      await this.ensureBuildingExists(dto.buildingId);
    }

    await this.prisma.house.update({
      where: { id },
      data: {
        ...(dto.buildingId ? { buildingId: dto.buildingId } : {}),
        ...(dto.unitNo !== undefined ? { unitNo: dto.unitNo ?? '' } : {}),
        ...(dto.floorNo !== undefined ? { floorNo: dto.floorNo ?? null } : {}),
        ...(dto.roomNo ? { roomNo: dto.roomNo } : {}),
        ...(dto.displayName ? { displayName: dto.displayName } : {}),
        ...(dto.houseStatus ? { houseStatus: dto.houseStatus as any } : {}),
        ...(dto.grossArea !== undefined ? { grossArea: dto.grossArea ?? null } : {}),
      },
    });

    const updated = await this.getAdminDetail(id);
    await this.auditLogService.recordAdminAction({
      context,
      action: 'UPDATE',
      resourceType: 'HOUSE',
      resourceId: id,
      resourceName: updated.displayName,
      snapshot: { before, after: updated },
    });

    return updated;
  }

  async removeAdmin(id: string, context?: AdminAuditContext) {
    const before = await this.getAdminDetail(id);

    const [memberCount, identityCount, voteCount, archiveCount] = await this.prisma.$transaction([
      this.prisma.houseMemberRelation.count({ where: { houseId: id } }),
      this.prisma.identityApplication.count({ where: { houseId: id } }),
      this.prisma.voteRepresentative.count({ where: { houseId: id } }),
      this.prisma.residentArchive.count({
        where: {
          houseId: id,
          status: {
            in: ['ACTIVE', 'SYNCED'],
          },
        },
      }),
    ]);

    if (memberCount > 0 || identityCount > 0 || voteCount > 0 || archiveCount > 0) {
      throw new BusinessException(
        AppErrorCode.INVALID_OPERATION,
        'House has related data and cannot be deleted',
        HttpStatus.BAD_REQUEST,
      );
    }

    await this.prisma.$transaction([
      this.prisma.householdGroup.deleteMany({
        where: { houseId: id },
      }),
      this.prisma.house.delete({
        where: { id },
      }),
    ]);

    await this.auditLogService.recordAdminAction({
      context,
      action: 'DELETE',
      resourceType: 'HOUSE',
      resourceId: id,
      resourceName: before.displayName,
      snapshot: { before },
    });

    return {
      id,
      removed: true,
    };
  }

  private mapHouseListItem(house: any) {
    const primaryRelation = house.memberRelations.find((item: any) => item.isPrimaryRole);
    const activeHousehold = house.householdGroups[0];

    return {
      id: house.id,
      buildingId: house.buildingId,
      buildingName: house.building.buildingName,
      unitNo: house.unitNo,
      roomNo: house.roomNo,
      displayName: house.displayName,
      houseStatus: house.houseStatus,
      activeHouseholdType: activeHousehold
        ? householdGroupLabelMap[activeHousehold.groupType] ?? activeHousehold.groupType
        : null,
      memberCount: house.memberRelations.length,
      primaryRoleName: primaryRelation?.user?.realName ?? primaryRelation?.user?.nickname ?? null,
      createdAt: house.createdAt,
    };
  }

  private mapResidentArchiveItem(archive: any) {
    return {
      id: archive.id,
      mobile: archive.mobile,
      realName: archive.realName,
      relationType: archive.relationType,
      relationLabel: archive.relationLabel,
      status: archive.status,
      remark: archive.remark,
      matchedUserId: archive.matchedUserId ?? null,
      matchedUserName:
        archive.matchedUser?.realName ??
        archive.matchedUser?.nickname ??
        archive.matchedUser?.mobile ??
        null,
      matchedAt: archive.matchedAt ?? null,
      createdAt: archive.createdAt,
      updatedAt: archive.updatedAt,
    };
  }

  private mapHouseDetail(house: any) {
    return {
      id: house.id,
      buildingId: house.buildingId,
      buildingName: house.building.buildingName,
      unitNo: house.unitNo,
      floorNo: house.floorNo,
      roomNo: house.roomNo,
      displayName: house.displayName,
      houseStatus: house.houseStatus,
      grossArea: house.grossArea,
      createdAt: house.createdAt,
      updatedAt: house.updatedAt,
      householdGroups: house.householdGroups.map((group: any) => ({
        id: group.id,
        groupType: group.groupType,
        groupTypeLabel: householdGroupLabelMap[group.groupType] ?? group.groupType,
        status: group.status,
        startedAt: group.startedAt,
        endedAt: group.endedAt,
        memberCount: group.memberRelations?.length ?? 0,
      })),
      members: house.memberRelations?.map((item: any) => ({
        id: item.id,
        userId: item.userId,
        userName: item.user.realName ?? item.user.nickname ?? '未命名用户',
        mobile: item.user.mobile,
        relationType: item.relationType,
        relationLabel: memberRelationLabelMap[item.relationType] ?? item.relationType,
        householdGroupId: item.householdGroupId,
        householdType: item.householdGroup
          ? householdGroupLabelMap[item.householdGroup.groupType] ?? item.householdGroup.groupType
          : null,
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
      activeVoteRepresentatives: house.voteRepresentatives?.map((item: any) => ({
        id: item.id,
        scopeType: item.scopeType,
        voteId: item.voteId,
        effectiveAt: item.effectiveAt,
        expiredAt: item.expiredAt,
        representativeUserId: item.representativeRelation.userId,
        representativeUserName:
          item.representativeRelation.user.realName ??
          item.representativeRelation.user.nickname ??
          '未命名用户',
      })),
    };
  }

  private async ensureHouseExists(id: string) {
    const house = await this.prisma.house.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!house) {
      throw new BusinessException(
        AppErrorCode.HOUSE_NOT_FOUND,
        'House not found',
        HttpStatus.NOT_FOUND,
      );
    }
  }

  async ensureBuildingExists(buildingId: string) {
    const building = await this.prisma.building.findUnique({
      where: { id: buildingId },
      select: { id: true },
    });

    if (!building) {
      throw new BusinessException(
        AppErrorCode.INVALID_OPERATION,
        'Building is invalid',
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
