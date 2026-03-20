import { readFileSync, existsSync } from 'node:fs';
import { basename, join } from 'node:path';
import {
  PrismaClient,
  BuildingStatus,
  HouseStatus,
  HouseholdGroupStatus,
  HouseholdGroupType,
} from '@prisma/client';
import {
  buildManagementFeeSnapshots,
  getLegacyManagementFeePeriodSeedData,
  upsertManagementFeePeriod,
} from './management-fee-period-helpers';

interface RawBuildingItem {
  total_households: number;
  paid_rooms?: string[];
  unpaid_rooms?: string[];
}

interface RawPayload {
  meta?: Record<string, unknown>;
  buildings?: Record<string, RawBuildingItem>;
}

interface BuildingImportItem {
  buildingNo: number;
  buildingName: string;
  roomNos: string[];
  paidRooms: string[];
  totalHouseholds: number;
}

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

function getBuildingPrefix() {
  return process.env.MANAGEMENT_FEE_BUILDING_PREFIX?.trim() || 'HJY#';
}

function getDefaultPeriodMonth() {
  return process.env.MANAGEMENT_FEE_PERIOD_MONTH?.trim() || '2026-03';
}

function ensureValidPeriodMonth(periodMonth: string): string {
  if (!/^\d{4}-\d{2}$/.test(periodMonth)) {
    throw new Error(`Invalid period month: ${periodMonth}`);
  }
  return periodMonth;
}

function createDateAtUtc8(value: string) {
  return new Date(`${value}+08:00`);
}

function formatDateAtUtc8(date: Date) {
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Hong_Kong',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

function buildPeriodKey(chargeStartDate: Date, chargeEndDate: Date) {
  const start = formatDateAtUtc8(chargeStartDate);
  const end = formatDateAtUtc8(chargeEndDate);
  return `${start}_${end}`;
}

function getPeriodDates(periodMonth: string) {
  const [yearText, monthText] = periodMonth.split('-');
  const year = Number(yearText);
  const month = Number(monthText);
  const coverageMonths = Number(process.env.MANAGEMENT_FEE_COVERAGE_MONTHS?.trim() || '3');
  const coverageEndMonthIndex = month - 1 + Math.max(coverageMonths - 1, 0);
  const coverageEndYear = year + Math.floor(coverageEndMonthIndex / 12);
  const coverageEndMonth = (coverageEndMonthIndex % 12) + 1;
  const lastDay = new Date(coverageEndYear, coverageEndMonth, 0).getDate();

  const chargeStartDate = process.env.MANAGEMENT_FEE_CHARGE_START_DATE?.trim()
    ? new Date(process.env.MANAGEMENT_FEE_CHARGE_START_DATE.trim())
    : createDateAtUtc8(`${periodMonth}-01T00:00:00`);
  const chargeEndDate = process.env.MANAGEMENT_FEE_CHARGE_END_DATE?.trim()
    ? new Date(process.env.MANAGEMENT_FEE_CHARGE_END_DATE.trim())
    : createDateAtUtc8(
        `${coverageEndYear}-${String(coverageEndMonth).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}T23:59:59`,
      );
  const dueDate = process.env.MANAGEMENT_FEE_DUE_DATE?.trim()
    ? new Date(process.env.MANAGEMENT_FEE_DUE_DATE.trim())
    : createDateAtUtc8(
        `${coverageEndYear}-${String(coverageEndMonth).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}T23:59:59`,
      );

  return { chargeStartDate, chargeEndDate, dueDate };
}

function sortRoomNos(roomNos: Iterable<string>) {
  return Array.from(new Set(roomNos))
    .sort((a, b) => Number(a) - Number(b));
}

function normalizeRoomNo(roomNo: string) {
  const value = String(roomNo).trim();
  if (!/^\d{3,4}$/.test(value)) {
    throw new Error(`Invalid room number: ${roomNo}`);
  }
  return value;
}

function parseBuildingItems(payload: RawPayload): BuildingImportItem[] {
  if (!payload.buildings || typeof payload.buildings !== 'object') {
    throw new Error('Invalid payload: buildings is required');
  }

  return Object.entries(payload.buildings)
    .map(([buildingName, item]) => {
      const matched = buildingName.match(/^(\d+)栋$/);
      if (!matched) {
        throw new Error(`Invalid building name: ${buildingName}`);
      }

      const paidRooms = sortRoomNos((item.paid_rooms || []).map(normalizeRoomNo));
      const unpaidRooms = sortRoomNos((item.unpaid_rooms || []).map(normalizeRoomNo));
      const roomNos = sortRoomNos([...paidRooms, ...unpaidRooms]);
      const paidRoomSet = new Set(paidRooms);
      const duplicateRooms = unpaidRooms.filter((roomNo) => paidRoomSet.has(roomNo));

      if (duplicateRooms.length) {
        throw new Error(`${buildingName} has duplicate paid/unpaid rooms: ${duplicateRooms.join(', ')}`);
      }

      if (item.total_households !== roomNos.length) {
        throw new Error(
          `${buildingName} total_households=${item.total_households} but parsed rooms=${roomNos.length}`,
        );
      }

      return {
        buildingNo: Number(matched[1]),
        buildingName,
        roomNos,
        paidRooms,
        totalHouseholds: item.total_households,
      };
    })
    .sort((a, b) => a.buildingNo - b.buildingNo);
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

function buildPaidDate(periodMonth: string, index: number) {
  const day = String((index % 20) + 1).padStart(2, '0');
  return createDateAtUtc8(`${periodMonth}-${day}T12:00:00`);
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

function resolveJsonPath() {
  const cliPath = process.argv[2]?.trim();
  const envPath = process.env.MANAGEMENT_FEE_JSON_PATH?.trim();
  const filePath = cliPath || envPath;

  if (!filePath) {
    throw new Error('JSON file path is required. Usage: npm run import:management-fees:json -- <file>');
  }

  if (!existsSync(filePath)) {
    throw new Error(`JSON file not found: ${filePath}`);
  }

  return filePath;
}

async function main(): Promise<void> {
  loadLocalEnv();

  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required. Please configure backend/.env first.');
  }

  const jsonPath = resolveJsonPath();
  const periodMonth = ensureValidPeriodMonth(getDefaultPeriodMonth());
  const buildingPrefix = getBuildingPrefix();
  const { chargeStartDate, chargeEndDate, dueDate } = getPeriodDates(periodMonth);
  const periodKey = buildPeriodKey(chargeStartDate, chargeEndDate);
  const payload = JSON.parse(readFileSync(jsonPath, 'utf8')) as RawPayload;
  const buildingItems = parseBuildingItems(payload);
  const sourceFileName = basename(jsonPath);
  const metaNote = payload.meta ? ` meta=${JSON.stringify(payload.meta)}` : '';
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
        periodKey,
        periodMonth,
        chargeStartDate,
        chargeEndDate,
        dueDate,
        note: `按真实 JSON 导入初始化账期：${sourceFileName}`,
      }),
    );

    for (const item of buildingItems) {
      const buildingCode = `${buildingPrefix}${item.buildingNo}`;
      const paidSet = new Set(item.paidRooms);

      const existingBuilding = await prisma.building.findUnique({
        where: { buildingCode },
        select: { id: true },
      });

      const building = await prisma.building.upsert({
        where: { buildingCode },
        update: {
          buildingName: item.buildingName,
          sortNo: item.buildingNo,
          status: BuildingStatus.ACTIVE,
        },
        create: {
          buildingCode,
          buildingName: item.buildingName,
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
        const displayName = `${item.buildingName} ${roomNo}`;
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
              remark: '按真实管理费数据导入时初始化默认住户组',
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
              periodKey,
              houseId: house.id,
            },
          },
          update: {
            periodId: period.id,
            periodKey,
            periodMonth,
            chargeStartDate,
            chargeEndDate,
            dueDate,
            grossAreaSnapshot: snapshots.grossAreaSnapshot,
            unitPriceSnapshot: snapshots.unitPriceSnapshot,
            baseAmountSnapshot: snapshots.baseAmountSnapshot,
            receivableAmount: snapshots.receivableAmount,
            paidAmount: isPaid ? snapshots.receivableAmount : 0,
            paymentStatus: isPaid ? 'PAID' : 'PENDING',
            source: 'json_import',
            paidAt: isPaid ? buildPaidDate(periodMonth, paidIndex) : null,
            note: `按真实 JSON 导入：${sourceFileName}; building=${item.buildingName};${metaNote}`,
          },
          create: {
            periodId: period.id,
            periodKey,
            periodMonth,
            houseId: house.id,
            chargeStartDate,
            chargeEndDate,
            dueDate,
            grossAreaSnapshot: snapshots.grossAreaSnapshot,
            unitPriceSnapshot: snapshots.unitPriceSnapshot,
            baseAmountSnapshot: snapshots.baseAmountSnapshot,
            receivableAmount: snapshots.receivableAmount,
            paidAmount: isPaid ? snapshots.receivableAmount : 0,
            paymentStatus: isPaid ? 'PAID' : 'PENDING',
            source: 'json_import',
            paidAt: isPaid ? buildPaidDate(periodMonth, paidIndex) : null,
            note: `按真实 JSON 导入：${sourceFileName}; building=${item.buildingName};${metaNote}`,
          },
        });

        if (isPaid) {
          paidIndex += 1;
        }

        result.upsertedFeeRecords += 1;
      }

      await prisma.managementFeeRecord.deleteMany({
        where: {
          periodKey,
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
          sourceFile: jsonPath,
          periodMonth,
          importedBuildings: buildingItems.length,
          totalsFromJson: {
            households: buildingItems.reduce((sum, item) => sum + item.totalHouseholds, 0),
            paidRooms: buildingItems.reduce((sum, item) => sum + item.paidRooms.length, 0),
          },
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
