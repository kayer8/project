import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import {
  PrismaClient,
  BuildingStatus,
  HouseStatus,
  HouseholdGroupStatus,
  HouseholdGroupType,
} from '@prisma/client';
import { actualBuildings } from './import-hjy-management-fees.data';
import {
  buildManagementFeeSnapshots,
  getLegacyManagementFeePeriodSeedData,
  upsertManagementFeePeriod,
} from './management-fee-period-helpers';

const PERIOD_MONTH = '2026-03';
const BUILDING_PREFIX = 'HJY#';
const CHARGE_START_DATE = new Date('2026-03-01T00:00:00+08:00');
const CHARGE_END_DATE = new Date('2026-05-31T23:59:59+08:00');
const DUE_DATE = new Date('2026-05-31T23:59:59+08:00');
const PERIOD_KEY = '2026-03-01_2026-05-31';

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

function parseFloor(roomNo: string) {
  return Number(roomNo.slice(0, roomNo.length - 2));
}

function parseUnitIndex(roomNo: string) {
  return Number(roomNo.slice(-2));
}

function guessGrossArea(roomNo: string) {
  const unitIndex = parseUnitIndex(roomNo);

  if (unitIndex === 1) return 86;
  if (unitIndex === 2) return 96;
  if (unitIndex === 3) return 106;
  if (unitIndex === 4) return 118;
  return 96;
}

function buildPaidDate(index: number) {
  const day = String((index % 20) + 1).padStart(2, '0');
  return new Date(`${PERIOD_MONTH}-${day}T12:00:00+08:00`);
}

async function deleteRemovedHouseDependencies(prisma: PrismaClient, houseIds: string[]) {
  if (houseIds.length === 0) {
    return 0;
  }

  const householdGroups = await prisma.householdGroup.findMany({
    where: { houseId: { in: houseIds } },
    select: { id: true },
  });
  const householdGroupIds = householdGroups.map((item) => item.id);

  const memberRelations = await prisma.houseMemberRelation.findMany({
    where: { houseId: { in: houseIds } },
    select: { id: true },
  });
  const memberRelationIds = memberRelations.map((item) => item.id);

  await prisma.$transaction(async (tx) => {
    await tx.managementFeeRecord.deleteMany({
      where: { houseId: { in: houseIds } },
    });

    await tx.residentArchive.deleteMany({
      where: { houseId: { in: houseIds } },
    });

    await tx.registrationRequest.deleteMany({
      where: { houseId: { in: houseIds } },
    });

    await tx.voteRepresentative.deleteMany({
      where: memberRelationIds.length
        ? {
            OR: [
              { houseId: { in: houseIds } },
              { representativeRelationId: { in: memberRelationIds } },
              { grantorRelationId: { in: memberRelationIds } },
            ],
          }
        : {
            houseId: { in: houseIds },
          },
    });

    await tx.memberChangeRequest.deleteMany({
      where: householdGroupIds.length
        ? {
            OR: [
              { houseId: { in: houseIds } },
              { householdGroupId: { in: householdGroupIds } },
            ],
          }
        : {
            houseId: { in: houseIds },
          },
    });

    await tx.identityApplication.deleteMany({
      where: { houseId: { in: houseIds } },
    });

    if (memberRelationIds.length) {
      await tx.houseMemberRelation.deleteMany({
        where: { id: { in: memberRelationIds } },
      });
    }

    if (householdGroupIds.length) {
      await tx.householdGroup.deleteMany({
        where: { id: { in: householdGroupIds } },
      });
    }

    await tx.house.deleteMany({
      where: { id: { in: houseIds } },
    });
  });

  return houseIds.length;
}

async function main(): Promise<void> {
  loadLocalEnv();

  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required. Please configure backend/.env first.');
  }

  const prisma = new PrismaClient();

  const result = {
    createdBuildings: 0,
    updatedBuildings: 0,
    createdHouses: 0,
    updatedHouses: 0,
    removedHouses: 0,
    createdHouseholdGroups: 0,
    upsertedFeeRecords: 0,
  };

  try {
    const period = await upsertManagementFeePeriod(
      prisma,
      getLegacyManagementFeePeriodSeedData({
        periodKey: PERIOD_KEY,
        periodMonth: PERIOD_MONTH,
        chargeStartDate: CHARGE_START_DATE,
        chargeEndDate: CHARGE_END_DATE,
        dueDate: DUE_DATE,
        note: '按楼栋照片人工导入初始化账期',
      }),
    );

    for (const item of actualBuildings) {
      const buildingCode = `${BUILDING_PREFIX}${item.buildingNo}`;
      const buildingName = `和景苑小区${item.buildingNo}栋`;
      const paidSet = new Set(item.paidRooms);

      const existingBuilding = await prisma.building.findUnique({
        where: { buildingCode },
        select: { id: true },
      });

      const building = await prisma.building.upsert({
        where: { buildingCode },
        update: {
          buildingName,
          sortNo: item.buildingNo,
          status: BuildingStatus.ACTIVE,
        },
        create: {
          buildingCode,
          buildingName,
          sortNo: item.buildingNo,
          status: BuildingStatus.ACTIVE,
        },
      });

      if (existingBuilding) {
        result.updatedBuildings += 1;
      } else {
        result.createdBuildings += 1;
      }

      const existingHouses = await prisma.house.findMany({
        where: { buildingId: building.id },
        select: {
          id: true,
          roomNo: true,
        },
      });

      const desiredRooms = new Set(item.roomNos);
      const removedHouseIds = existingHouses
        .filter((house) => !desiredRooms.has(house.roomNo))
        .map((house) => house.id);
      result.removedHouses += await deleteRemovedHouseDependencies(prisma, removedHouseIds);

      const desiredHouseIds: string[] = [];
      let paidIndex = 0;

      for (const roomNo of item.roomNos) {
        const floorNo = parseFloor(roomNo);
        const unitNo = '';
        const displayName = `${buildingName} ${roomNo}`;
        const existingHouse = existingHouses.find((house) => house.roomNo === roomNo);

        const house = await prisma.house.upsert({
          where: {
            buildingId_unitNo_roomNo: {
              buildingId: building.id,
              unitNo,
              roomNo,
            },
          },
          update: {
            floorNo,
            displayName,
            houseStatus: HouseStatus.SELF_OCCUPIED,
            grossArea: guessGrossArea(roomNo),
          },
          create: {
            buildingId: building.id,
            unitNo,
            floorNo,
            roomNo,
            displayName,
            houseStatus: HouseStatus.SELF_OCCUPIED,
            grossArea: guessGrossArea(roomNo),
          },
        });

        desiredHouseIds.push(house.id);

        if (existingHouse) {
          result.updatedHouses += 1;
        } else {
          result.createdHouses += 1;
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
              remark: '实际楼栋数据导入时初始化默认住户组',
            },
          });
          result.createdHouseholdGroups += 1;
        }

        const isPaid = paidSet.has(roomNo);
        const snapshots = buildManagementFeeSnapshots(
          {
            pricingMode: period.pricingMode as 'AREA_TIERED',
            unitPrice: period.unitPrice,
            baseAmount: period.baseAmount,
            defaultArea: period.defaultArea,
            pricingRuleJson: (period.pricingRuleJson as Record<string, unknown> | null) ?? null,
          },
          guessGrossArea(roomNo),
        );

        await prisma.managementFeeRecord.upsert({
          where: {
            periodKey_houseId: {
              periodKey: PERIOD_KEY,
              houseId: house.id,
            },
          },
          update: {
            periodId: period.id,
            periodKey: PERIOD_KEY,
            periodMonth: PERIOD_MONTH,
            chargeStartDate: CHARGE_START_DATE,
            chargeEndDate: CHARGE_END_DATE,
            dueDate: DUE_DATE,
            grossAreaSnapshot: snapshots.grossAreaSnapshot,
            unitPriceSnapshot: snapshots.unitPriceSnapshot,
            baseAmountSnapshot: snapshots.baseAmountSnapshot,
            receivableAmount: snapshots.receivableAmount,
            paidAmount: isPaid ? snapshots.receivableAmount : 0,
            paymentStatus: isPaid ? 'PAID' : 'PENDING',
            source: 'manual_import',
            paidAt: isPaid ? buildPaidDate(paidIndex) : null,
            note: `按楼栋照片人工导入：${buildingName}`,
          },
          create: {
            periodId: period.id,
            periodKey: PERIOD_KEY,
            periodMonth: PERIOD_MONTH,
            houseId: house.id,
            chargeStartDate: CHARGE_START_DATE,
            chargeEndDate: CHARGE_END_DATE,
            dueDate: DUE_DATE,
            grossAreaSnapshot: snapshots.grossAreaSnapshot,
            unitPriceSnapshot: snapshots.unitPriceSnapshot,
            baseAmountSnapshot: snapshots.baseAmountSnapshot,
            receivableAmount: snapshots.receivableAmount,
            paidAmount: isPaid ? snapshots.receivableAmount : 0,
            paymentStatus: isPaid ? 'PAID' : 'PENDING',
            source: 'manual_import',
            paidAt: isPaid ? buildPaidDate(paidIndex) : null,
            note: `按楼栋照片人工导入：${buildingName}`,
          },
        });

        if (isPaid) {
          paidIndex += 1;
        }

        result.upsertedFeeRecords += 1;
      }

      await prisma.managementFeeRecord.deleteMany({
        where: {
          periodKey: PERIOD_KEY,
          house: {
            buildingId: building.id,
          },
          houseId: {
            notIn: desiredHouseIds,
          },
        },
      });
    }

    console.log(
      JSON.stringify(
        {
          success: true,
          periodMonth: PERIOD_MONTH,
          importedBuildings: actualBuildings.length,
          ...result,
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
