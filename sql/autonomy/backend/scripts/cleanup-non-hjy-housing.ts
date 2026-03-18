import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { PrismaClient } from '@prisma/client';

const BUILDING_PREFIX = 'HJY#';

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

async function main(): Promise<void> {
  loadLocalEnv();

  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required. Please configure backend/.env first.');
  }

  const prisma = new PrismaClient();

  try {
    const buildings = await prisma.building.findMany({
      where: {
        NOT: {
          buildingCode: {
            startsWith: BUILDING_PREFIX,
          },
        },
      },
      select: {
        id: true,
      },
    });

    const buildingIds = buildings.map((item) => item.id);

    if (buildingIds.length === 0) {
      console.log(
        JSON.stringify(
          {
            success: true,
            removed: {
              buildings: 0,
              houses: 0,
              householdGroups: 0,
              memberRelations: 0,
              identityApplications: 0,
              memberChangeRequests: 0,
              voteRepresentatives: 0,
            },
          },
          null,
          2,
        ),
      );
      return;
    }

    const houses = await prisma.house.findMany({
      where: {
        buildingId: {
          in: buildingIds,
        },
      },
      select: {
        id: true,
      },
    });
    const houseIds = houses.map((item) => item.id);

    const householdGroups = houseIds.length
      ? await prisma.householdGroup.findMany({
          where: {
            houseId: {
              in: houseIds,
            },
          },
          select: {
            id: true,
          },
        })
      : [];
    const householdGroupIds = householdGroups.map((item) => item.id);

    const memberRelations = houseIds.length
      ? await prisma.houseMemberRelation.findMany({
          where: {
            houseId: {
              in: houseIds,
            },
          },
          select: {
            id: true,
          },
        })
      : [];
    const memberRelationIds = memberRelations.map((item) => item.id);

    const removed = await prisma.$transaction(async (tx) => {
      let deletedVoteRepresentatives = 0;
      let deletedMemberChangeRequests = 0;
      let deletedIdentityApplications = 0;
      let deletedMemberRelations = 0;
      let deletedHouseholdGroups = 0;
      let deletedHouses = 0;

      if (memberRelationIds.length || houseIds.length) {
        const voteRepresentativeWhere = memberRelationIds.length
          ? {
              OR: [
                {
                  houseId: {
                    in: houseIds,
                  },
                },
                {
                  representativeRelationId: {
                    in: memberRelationIds,
                  },
                },
                {
                  grantorRelationId: {
                    in: memberRelationIds,
                  },
                },
              ],
            }
          : {
              houseId: {
                in: houseIds,
              },
            };

        deletedVoteRepresentatives = (
          await tx.voteRepresentative.deleteMany({
            where: voteRepresentativeWhere,
          })
        ).count;
      }

      if (houseIds.length || householdGroupIds.length) {
        const memberChangeRequestWhere = householdGroupIds.length
          ? {
              OR: [
                {
                  houseId: {
                    in: houseIds,
                  },
                },
                {
                  householdGroupId: {
                    in: householdGroupIds,
                  },
                },
              ],
            }
          : {
              houseId: {
                in: houseIds,
              },
            };

        deletedMemberChangeRequests = (
          await tx.memberChangeRequest.deleteMany({
            where: memberChangeRequestWhere,
          })
        ).count;
      }

      if (houseIds.length) {
        deletedIdentityApplications = (
          await tx.identityApplication.deleteMany({
            where: {
              houseId: {
                in: houseIds,
              },
            },
          })
        ).count;
      }

      if (memberRelationIds.length) {
        deletedMemberRelations = (
          await tx.houseMemberRelation.deleteMany({
            where: {
              id: {
                in: memberRelationIds,
              },
            },
          })
        ).count;
      }

      if (householdGroupIds.length) {
        deletedHouseholdGroups = (
          await tx.householdGroup.deleteMany({
            where: {
              id: {
                in: householdGroupIds,
              },
            },
          })
        ).count;
      }

      if (houseIds.length) {
        deletedHouses = (
          await tx.house.deleteMany({
            where: {
              id: {
                in: houseIds,
              },
            },
          })
        ).count;
      }

      const deletedBuildings = (
        await tx.building.deleteMany({
          where: {
            id: {
              in: buildingIds,
            },
          },
        })
      ).count;

      return {
        buildings: deletedBuildings,
        houses: deletedHouses,
        householdGroups: deletedHouseholdGroups,
        memberRelations: deletedMemberRelations,
        identityApplications: deletedIdentityApplications,
        memberChangeRequests: deletedMemberChangeRequests,
        voteRepresentatives: deletedVoteRepresentatives,
      };
    });

    console.log(
      JSON.stringify(
        {
          success: true,
          removed,
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
