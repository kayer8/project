import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { PrismaClient } from '@prisma/client';
import { buildManagementFeeSnapshots } from './management-fee-period-helpers';

const TARGET_UNIT_PRICE = 2.68;
const TARGET_BASE_AMOUNT = 18;
const TARGET_DEFAULT_AREA = 88;

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

function round(value: number) {
  return Math.round(value * 100) / 100;
}

async function main() {
  loadLocalEnv();

  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required. Please configure backend/.env first.');
  }

  const prisma = new PrismaClient();

  try {
    const periods = await prisma.managementFeePeriod.findMany({
      include: {
        records: {
          include: {
            house: true,
          },
        },
      },
      orderBy: [{ chargeStartDate: 'asc' }],
    });

    let updatedPeriods = 0;
    let updatedRecords = 0;

    for (const period of periods) {
      await prisma.managementFeePeriod.update({
        where: { id: period.id },
        data: {
          pricingMode: 'AREA_UNIFORM',
          unitPrice: TARGET_UNIT_PRICE,
          baseAmount: TARGET_BASE_AMOUNT,
          defaultArea: TARGET_DEFAULT_AREA,
          pricingRuleJson: {
            type: 'AREA_UNIFORM',
            unitPrice: TARGET_UNIT_PRICE,
          },
        },
      });
      updatedPeriods += 1;

      for (const record of period.records) {
        const snapshots = buildManagementFeeSnapshots(
          {
            pricingMode: 'AREA_UNIFORM',
            unitPrice: TARGET_UNIT_PRICE,
            baseAmount: TARGET_BASE_AMOUNT,
            defaultArea: TARGET_DEFAULT_AREA,
            pricingRuleJson: {
              type: 'AREA_UNIFORM',
              unitPrice: TARGET_UNIT_PRICE,
            },
          },
          record.house.grossArea,
        );

        const paidAmount =
          record.paymentStatus === 'PAID'
            ? snapshots.receivableAmount
            : record.paymentStatus === 'PARTIAL'
              ? round(snapshots.receivableAmount / 2)
              : 0;

        await prisma.managementFeeRecord.update({
          where: { id: record.id },
          data: {
            grossAreaSnapshot: snapshots.grossAreaSnapshot,
            unitPriceSnapshot: snapshots.unitPriceSnapshot,
            baseAmountSnapshot: snapshots.baseAmountSnapshot,
            receivableAmount: snapshots.receivableAmount,
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
          unitPrice: TARGET_UNIT_PRICE,
          baseAmount: TARGET_BASE_AMOUNT,
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
