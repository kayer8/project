import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import {
  PrismaClient,
  BuildingStatus,
  HouseStatus,
  HouseholdGroupStatus,
  HouseholdGroupType,
} from '@prisma/client';

const BUILDING_PREFIX = 'HJY#';
const BUILDING_TOTAL = 20;
const FLOOR_TOTAL = 18;
const HOUSES_PER_FLOOR = 4;
const DEFAULT_GROSS_AREA = 100;
const DEFAULT_UNIT_NO = '';

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

function buildRoomNumber(floorNo: number, roomIndex: number): string {
  return `${floorNo}${String(roomIndex).padStart(2, '0')}`;
}

async function main(): Promise<void> {
  loadLocalEnv();

  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required. Please configure backend/.env first.');
  }

  const prisma = new PrismaClient();

  let createdBuildings = 0;
  let updatedBuildings = 0;
  let createdHouses = 0;
  let updatedHouses = 0;
  let createdHouseholdGroups = 0;

  try {
    for (let buildingNo = 1; buildingNo <= BUILDING_TOTAL; buildingNo += 1) {
      const buildingCode = `${BUILDING_PREFIX}${buildingNo}`;
      const buildingName = `${buildingNo}栋`;

      const existingBuilding = await prisma.building.findUnique({
        where: { buildingCode },
        select: { id: true },
      });

      const building = await prisma.building.upsert({
        where: { buildingCode },
        update: {
          buildingName,
          sortNo: buildingNo,
          status: BuildingStatus.ACTIVE,
        },
        create: {
          buildingCode,
          buildingName,
          sortNo: buildingNo,
          status: BuildingStatus.ACTIVE,
        },
      });

      if (existingBuilding) {
        updatedBuildings += 1;
      } else {
        createdBuildings += 1;
      }

      for (let floorNo = 1; floorNo <= FLOOR_TOTAL; floorNo += 1) {
        for (let roomIndex = 1; roomIndex <= HOUSES_PER_FLOOR; roomIndex += 1) {
          const roomNo = buildRoomNumber(floorNo, roomIndex);
          const displayName = `${buildingName} ${roomNo}`;

          const existingHouse = await prisma.house.findUnique({
            where: {
              buildingId_unitNo_roomNo: {
                buildingId: building.id,
                unitNo: DEFAULT_UNIT_NO,
                roomNo,
              },
            },
            select: { id: true },
          });

          const house = await prisma.house.upsert({
            where: {
              buildingId_unitNo_roomNo: {
                buildingId: building.id,
                unitNo: DEFAULT_UNIT_NO,
                roomNo,
              },
            },
            update: {
              floorNo,
              displayName,
              houseStatus: HouseStatus.SELF_OCCUPIED,
              grossArea: DEFAULT_GROSS_AREA,
            },
            create: {
              buildingId: building.id,
              unitNo: DEFAULT_UNIT_NO,
              floorNo,
              roomNo,
              displayName,
              houseStatus: HouseStatus.SELF_OCCUPIED,
              grossArea: DEFAULT_GROSS_AREA,
            },
          });

          if (existingHouse) {
            updatedHouses += 1;
          } else {
            createdHouses += 1;
          }

          const activeHouseholdGroup = await prisma.householdGroup.findFirst({
            where: {
              houseId: house.id,
              status: HouseholdGroupStatus.ACTIVE,
            },
            select: { id: true },
          });

          if (!activeHouseholdGroup) {
            await prisma.householdGroup.create({
              data: {
                houseId: house.id,
                groupType: HouseholdGroupType.OWNER_HOUSEHOLD,
                status: HouseholdGroupStatus.ACTIVE,
                remark: '系统初始化默认住户组',
              },
            });
            createdHouseholdGroups += 1;
          }
        }
      }
    }

    const [buildingCount, houseCount, householdGroupCount] = await Promise.all([
      prisma.building.count(),
      prisma.house.count(),
      prisma.householdGroup.count(),
    ]);

    console.log(
      JSON.stringify(
        {
          success: true,
          createdBuildings,
          updatedBuildings,
          createdHouses,
          updatedHouses,
          createdHouseholdGroups,
          totals: {
            buildings: buildingCount,
            houses: houseCount,
            householdGroups: householdGroupCount,
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
