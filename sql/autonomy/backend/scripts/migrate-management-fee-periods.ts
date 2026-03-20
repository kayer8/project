import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { PrismaClient } from '@prisma/client';
import {
  buildManagementFeeSnapshots,
  getLegacyManagementFeePeriodSeedData,
  upsertManagementFeePeriod,
} from './management-fee-period-helpers';

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

async function main() {
  loadLocalEnv();

  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required. Please configure backend/.env first.');
  }

  const prisma = new PrismaClient();

  try {
    const legacyRecords = await prisma.managementFeeRecord.findMany({
      where: {
        OR: [
          { periodId: null },
          { grossAreaSnapshot: null },
          { unitPriceSnapshot: null },
          { baseAmountSnapshot: null },
          { receivableAmount: null },
          { paidAmount: null },
        ],
      },
      include: {
        period: true,
        house: true,
      },
      orderBy: [{ periodKey: 'asc' }, { createdAt: 'asc' }],
    });

    const periodMap = new Map<string, typeof legacyRecords>();
    for (const record of legacyRecords) {
      const items = periodMap.get(record.periodKey) ?? [];
      items.push(record);
      periodMap.set(record.periodKey, items);
    }

    let updatedPeriods = 0;
    let updatedRecords = 0;

    for (const [periodKey, records] of periodMap.entries()) {
      const first = records[0];
      const period =
        first.period ??
        (await upsertManagementFeePeriod(
          prisma,
          getLegacyManagementFeePeriodSeedData({
            periodKey,
            periodMonth: first.periodMonth,
            chargeStartDate: first.chargeStartDate ?? new Date(),
            chargeEndDate: first.chargeEndDate ?? first.chargeStartDate ?? new Date(),
            dueDate: first.dueDate ?? first.chargeEndDate ?? first.chargeStartDate ?? new Date(),
            note: '历史管理费数据迁移生成的账期',
          }),
        ));

      if (!first.period) {
        updatedPeriods += 1;
      }

      for (const record of records) {
        const snapshots = buildManagementFeeSnapshots(
          {
            pricingMode: period.pricingMode as 'AREA_UNIFORM' | 'AREA_TIERED',
            unitPrice: period.unitPrice,
            baseAmount: period.baseAmount,
            defaultArea: period.defaultArea,
            pricingRuleJson: (period.pricingRuleJson as Record<string, unknown> | null) ?? null,
          },
          record.house.grossArea,
        );
        const paidAmount =
          record.paidAmount ??
          (record.paymentStatus === 'PAID'
            ? snapshots.receivableAmount
            : record.paymentStatus === 'PARTIAL'
              ? Math.round((snapshots.receivableAmount / 2) * 100) / 100
              : 0);

        await prisma.managementFeeRecord.update({
          where: { id: record.id },
          data: {
            periodId: period.id,
            grossAreaSnapshot: record.grossAreaSnapshot ?? snapshots.grossAreaSnapshot,
            unitPriceSnapshot: record.unitPriceSnapshot ?? snapshots.unitPriceSnapshot,
            baseAmountSnapshot: record.baseAmountSnapshot ?? snapshots.baseAmountSnapshot,
            receivableAmount: record.receivableAmount ?? snapshots.receivableAmount,
            paidAmount,
          },
        });

        updatedRecords += 1;
      }
    }

    console.log(
      JSON.stringify(
        {
          success: true,
          updatedPeriods,
          updatedRecords,
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
