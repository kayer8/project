import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  PrismaClient,
  HouseholdGroupStatus,
  MemberRelationStatus,
  MemberRelationType,
  ResidentArchiveStatus,
  UserStatus,
} from '@prisma/client';

const MOCK_REGISTER_SOURCE = 'mock_seed';
const MOCK_ARCHIVE_REMARK_PREFIX = 'MOCK_SEED_RESIDENT';
const OWNER_COUNT = 100;
const FAMILY_COUNT = 100;

const OWNER_MULTI_HOUSE_RULES = [
  { end: 69, houseCount: 1 },
  { end: 89, houseCount: 2 },
  { end: 99, houseCount: 3 },
];

const surnames = [
  '张',
  '李',
  '王',
  '赵',
  '刘',
  '陈',
  '杨',
  '黄',
  '周',
  '吴',
  '徐',
  '孙',
  '胡',
  '朱',
  '高',
  '林',
  '何',
  '郭',
  '马',
  '罗',
];

function loadLocalEnv(): void {
  const envPath = join(process.cwd(), '.env');
  if (!existsSync(envPath)) {
    return;
  }

  const content = readFileSync(envPath, 'utf8');

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();

    if (!line || line.startsWith('#')) {
      continue;
    }

    const separatorIndex = line.indexOf('=');

    if (separatorIndex <= 0) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    let value = line.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

function pad(num: number): string {
  return String(num).padStart(3, '0');
}

function ownerHouseCount(index: number): number {
  const matched = OWNER_MULTI_HOUSE_RULES.find((rule) => index <= rule.end);
  return matched?.houseCount ?? 1;
}

function buildOwnerMobile(index: number): string {
  return `139800${String(index + 1).padStart(5, '0')}`;
}

function buildFamilyMobile(index: number): string {
  return `137700${String(index + 1).padStart(5, '0')}`;
}

function buildOwnerName(index: number): string {
  const surname = surnames[index % surnames.length];
  return `${surname}业主${pad(index + 1)}`;
}

function buildFamilyName(index: number, ownerName: string): string {
  const surname = ownerName.slice(0, 1);
  return `${surname}家属${pad(index + 1)}`;
}

function buildOwnerNickname(index: number): string {
  return `mock_owner_${pad(index + 1)}`;
}

function buildFamilyNickname(index: number): string {
  return `mock_family_${pad(index + 1)}`;
}

function buildOwnerOpenid(index: number): string {
  return `mock_owner_openid_${pad(index + 1)}`;
}

function buildFamilyOpenid(index: number): string {
  return `mock_family_openid_${pad(index + 1)}`;
}

function buildEffectiveAt(seed: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - (seed % 180));
  return date;
}

async function cleanupMockData(prisma: PrismaClient) {
  const mockUsers = await prisma.user.findMany({
    where: {
      registerSource: MOCK_REGISTER_SOURCE,
    },
    select: {
      id: true,
    },
  });

  const mockUserIds = mockUsers.map((item) => item.id);
  const mockRelationIds = mockUserIds.length
    ? (
        await prisma.houseMemberRelation.findMany({
          where: {
            userId: {
              in: mockUserIds,
            },
          },
          select: {
            id: true,
          },
        })
      ).map((item) => item.id)
    : [];

  const removed = await prisma.$transaction(async (tx) => {
    const deletedArchives = (
      await tx.residentArchive.deleteMany({
        where: {
          remark: {
            startsWith: MOCK_ARCHIVE_REMARK_PREFIX,
          },
        },
      })
    ).count;

    const deletedAuditLogs = mockUserIds.length
      ? (
          await tx.auditLog.deleteMany({
            where: {
              actorUserId: {
                in: mockUserIds,
              },
            },
          })
        ).count
      : 0;

    const deletedVoteRepresentatives = mockRelationIds.length
      ? (
          await tx.voteRepresentative.deleteMany({
            where: {
              OR: [
                {
                  representativeRelationId: {
                    in: mockRelationIds,
                  },
                },
                {
                  grantorRelationId: {
                    in: mockRelationIds,
                  },
                },
              ],
            },
          })
        ).count
      : 0;

    const deletedMemberChangeRequests = mockUserIds.length
      ? (
          await tx.memberChangeRequest.deleteMany({
            where: {
              OR: [
                {
                  operatorUserId: {
                    in: mockUserIds,
                  },
                },
                {
                  targetUserId: {
                    in: mockUserIds,
                  },
                },
              ],
            },
          })
        ).count
      : 0;

    const deletedRegistrationRequests = mockUserIds.length
      ? (
          await tx.registrationRequest.deleteMany({
            where: {
              userId: {
                in: mockUserIds,
              },
            },
          })
        ).count
      : 0;

    const deletedIdentityApplications = mockUserIds.length
      ? (
          await tx.identityApplication.deleteMany({
            where: {
              userId: {
                in: mockUserIds,
              },
            },
          })
        ).count
      : 0;

    const deletedCommunityRoles = mockUserIds.length
      ? (
          await tx.communityUserRole.deleteMany({
            where: {
              userId: {
                in: mockUserIds,
              },
            },
          })
        ).count
      : 0;

    const deletedMemberRelations = mockUserIds.length
      ? (
          await tx.houseMemberRelation.deleteMany({
            where: {
              userId: {
                in: mockUserIds,
              },
            },
          })
        ).count
      : 0;

    const deletedUsers = mockUserIds.length
      ? (
          await tx.user.deleteMany({
            where: {
              id: {
                in: mockUserIds,
              },
            },
          })
        ).count
      : 0;

    return {
      users: deletedUsers,
      memberRelations: deletedMemberRelations,
      memberChangeRequests: deletedMemberChangeRequests,
      voteRepresentatives: deletedVoteRepresentatives,
      communityRoles: deletedCommunityRoles,
      identityApplications: deletedIdentityApplications,
      registrationRequests: deletedRegistrationRequests,
      residentArchives: deletedArchives,
      auditLogs: deletedAuditLogs,
    };
  });

  return removed;
}

async function loadAvailableHouses(prisma: PrismaClient) {
  const houses = await prisma.house.findMany({
    include: {
      building: true,
      householdGroups: {
        where: {
          status: HouseholdGroupStatus.ACTIVE,
        },
        orderBy: {
          startedAt: 'desc',
        },
      },
      memberRelations: {
        where: {
          status: {
            in: [MemberRelationStatus.ACTIVE, MemberRelationStatus.PENDING],
          },
        },
        select: {
          id: true,
        },
      },
    },
  });

  return houses
    .filter((house) => house.householdGroups.length > 0 && house.memberRelations.length === 0)
    .sort((left, right) => {
      const leftSortNo = left.building.sortNo ?? Number.MAX_SAFE_INTEGER;
      const rightSortNo = right.building.sortNo ?? Number.MAX_SAFE_INTEGER;

      if (leftSortNo !== rightSortNo) {
        return leftSortNo - rightSortNo;
      }

      const buildingNameCompare = left.building.buildingName.localeCompare(
        right.building.buildingName,
        'zh-CN',
      );
      if (buildingNameCompare !== 0) {
        return buildingNameCompare;
      }

      const leftFloorNo = left.floorNo ?? Number.MAX_SAFE_INTEGER;
      const rightFloorNo = right.floorNo ?? Number.MAX_SAFE_INTEGER;
      if (leftFloorNo !== rightFloorNo) {
        return leftFloorNo - rightFloorNo;
      }

      return left.roomNo.localeCompare(right.roomNo, 'en-US');
    });
}

async function main(): Promise<void> {
  loadLocalEnv();

  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required. Please configure backend/.env first.');
  }

  const prisma = new PrismaClient();

  try {
    const cleanup = await cleanupMockData(prisma);
    const availableHouses = await loadAvailableHouses(prisma);
    const requiredOwnerRelations = Array.from({ length: OWNER_COUNT }).reduce<number>(
      (sum, _, index) => sum + ownerHouseCount(index),
      0,
    );

    if (availableHouses.length < requiredOwnerRelations) {
      throw new Error(
        `Not enough empty houses. Need ${requiredOwnerRelations}, but only ${availableHouses.length} available.`,
      );
    }

    const ownerAssignments: Array<{
      ownerIndex: number;
      houseId: string;
      buildingId: string;
      buildingName: string;
      displayName: string;
      householdGroupId: string;
      ownerName: string;
      ownerMobile: string;
    }> = [];

    let houseCursor = 0;
    for (let ownerIndex = 0; ownerIndex < OWNER_COUNT; ownerIndex += 1) {
      const relationCount = ownerHouseCount(ownerIndex);
      const ownerName = buildOwnerName(ownerIndex);
      const ownerMobile = buildOwnerMobile(ownerIndex);

      for (let relationIndex = 0; relationIndex < relationCount; relationIndex += 1) {
        const house = availableHouses[houseCursor];
        houseCursor += 1;

        ownerAssignments.push({
          ownerIndex,
          houseId: house.id,
          buildingId: house.buildingId,
          buildingName: house.building.buildingName,
          displayName: house.displayName,
          householdGroupId: house.householdGroups[0].id,
          ownerName,
          ownerMobile,
        });
      }
    }

    const familyAssignments = ownerAssignments.slice(0, FAMILY_COUNT).map((assignment, index) => ({
      familyIndex: index,
      houseId: assignment.houseId,
      buildingId: assignment.buildingId,
      householdGroupId: assignment.householdGroupId,
      ownerName: assignment.ownerName,
    }));

    let createdOwners = 0;
    let createdOwnerRelations = 0;
    let createdFamilyUsers = 0;
    let createdFamilyRelations = 0;
    let createdArchives = 0;

    const createdOwnerUsers = new Map<number, { id: string; realName: string; mobile: string }>();

    for (let ownerIndex = 0; ownerIndex < OWNER_COUNT; ownerIndex += 1) {
      const owner = await prisma.user.create({
        data: {
          mobile: buildOwnerMobile(ownerIndex),
          mobileVerifiedAt: new Date(),
          wechatOpenid: buildOwnerOpenid(ownerIndex),
          nickname: buildOwnerNickname(ownerIndex),
          realName: buildOwnerName(ownerIndex),
          status: UserStatus.ACTIVE,
          registerSource: MOCK_REGISTER_SOURCE,
          lastLoginAt: buildEffectiveAt(ownerIndex),
        },
      });

      createdOwnerUsers.set(ownerIndex, {
        id: owner.id,
        realName: owner.realName ?? buildOwnerName(ownerIndex),
        mobile: owner.mobile ?? buildOwnerMobile(ownerIndex),
      });
      createdOwners += 1;
    }

    for (let index = 0; index < ownerAssignments.length; index += 1) {
      const assignment = ownerAssignments[index];
      const owner = createdOwnerUsers.get(assignment.ownerIndex);

      if (!owner) {
        throw new Error(`Owner ${assignment.ownerIndex} not found during relation seeding.`);
      }

      await prisma.houseMemberRelation.create({
        data: {
          userId: owner.id,
          houseId: assignment.houseId,
          householdGroupId: assignment.householdGroupId,
          relationType: MemberRelationType.MAIN_OWNER,
          relationLabel: '主业主',
          isPrimaryRole: true,
          canViewBill: true,
          canPayBill: true,
          canActAsAgent: true,
          canJoinConsultation: true,
          canBeVoteDelegate: true,
          status: MemberRelationStatus.ACTIVE,
          effectiveAt: buildEffectiveAt(index),
        },
      });

      await prisma.residentArchive.create({
        data: {
          mobile: owner.mobile,
          realName: owner.realName,
          buildingId: assignment.buildingId,
          houseId: assignment.houseId,
          relationType: MemberRelationType.MAIN_OWNER,
          relationLabel: '主业主',
          status: ResidentArchiveStatus.ACTIVE,
          remark: `${MOCK_ARCHIVE_REMARK_PREFIX}:OWNER:${pad(index + 1)}`,
        },
      });

      createdOwnerRelations += 1;
      createdArchives += 1;
    }

    for (let familyIndex = 0; familyIndex < FAMILY_COUNT; familyIndex += 1) {
      const assignment = familyAssignments[familyIndex];
      const familyName = buildFamilyName(familyIndex, assignment.ownerName);
      const familyMobile = buildFamilyMobile(familyIndex);

      const familyUser = await prisma.user.create({
        data: {
          mobile: familyMobile,
          mobileVerifiedAt: new Date(),
          wechatOpenid: buildFamilyOpenid(familyIndex),
          nickname: buildFamilyNickname(familyIndex),
          realName: familyName,
          status: UserStatus.ACTIVE,
          registerSource: MOCK_REGISTER_SOURCE,
          lastLoginAt: buildEffectiveAt(OWNER_COUNT + familyIndex),
        },
      });

      await prisma.houseMemberRelation.create({
        data: {
          userId: familyUser.id,
          houseId: assignment.houseId,
          householdGroupId: assignment.householdGroupId,
          relationType: MemberRelationType.FAMILY_MEMBER,
          relationLabel: '家庭成员',
          isPrimaryRole: false,
          canViewBill: familyIndex % 2 === 0,
          canPayBill: false,
          canActAsAgent: familyIndex % 5 === 0,
          canJoinConsultation: true,
          canBeVoteDelegate: false,
          status: MemberRelationStatus.ACTIVE,
          effectiveAt: buildEffectiveAt(OWNER_COUNT + familyIndex),
        },
      });

      await prisma.residentArchive.create({
        data: {
          mobile: familyMobile,
          realName: familyName,
          buildingId: assignment.buildingId,
          houseId: assignment.houseId,
          relationType: MemberRelationType.FAMILY_MEMBER,
          relationLabel: '家庭成员',
          status: ResidentArchiveStatus.ACTIVE,
          remark: `${MOCK_ARCHIVE_REMARK_PREFIX}:FAMILY:${pad(familyIndex + 1)}`,
        },
      });

      createdFamilyUsers += 1;
      createdFamilyRelations += 1;
      createdArchives += 1;
    }

    console.log(
      JSON.stringify(
        {
          success: true,
          cleanup,
          created: {
            ownerUsers: createdOwners,
            ownerRelations: createdOwnerRelations,
            familyUsers: createdFamilyUsers,
            familyRelations: createdFamilyRelations,
            residentArchives: createdArchives,
          },
          totals: {
            mockUsers: await prisma.user.count({
              where: {
                registerSource: MOCK_REGISTER_SOURCE,
              },
            }),
            mockMemberRelations: await prisma.houseMemberRelation.count({
              where: {
                user: {
                  registerSource: MOCK_REGISTER_SOURCE,
                },
              },
            }),
            mockResidentArchives: await prisma.residentArchive.count({
              where: {
                remark: {
                  startsWith: MOCK_ARCHIVE_REMARK_PREFIX,
                },
              },
            }),
          },
        },
        null,
        2,
      ),
    );
  } finally {
    await prisma.$disconnect();
  }
}

void main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
