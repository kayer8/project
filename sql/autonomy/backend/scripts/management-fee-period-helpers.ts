import { Prisma } from '@prisma/client';
import type { PrismaClient } from '@prisma/client';

export type PricingMode = 'AREA_UNIFORM' | 'AREA_TIERED';

export interface PricingTier {
  minArea: number;
  maxArea: number | null;
  unitPrice: number;
}

export interface ManagementFeePeriodSeedData {
  periodKey: string;
  periodMonth: string;
  chargeStartDate: Date;
  chargeEndDate: Date;
  dueDate: Date;
  pricingMode: PricingMode;
  unitPrice?: number | null;
  baseAmount: number;
  defaultArea: number;
  pricingRuleJson?: Record<string, unknown> | null;
  note?: string | null;
}

export const LEGACY_MANAGEMENT_FEE_BASE_AMOUNT = 18;
export const LEGACY_MANAGEMENT_FEE_UNIT_PRICE = 2.68;
export const DEFAULT_MANAGEMENT_FEE_AREA = 88;

function round(value: number) {
  return Math.round(value * 100) / 100;
}

export function getLegacyManagementFeePeriodSeedData(
  input: Pick<
    ManagementFeePeriodSeedData,
    'periodKey' | 'periodMonth' | 'chargeStartDate' | 'chargeEndDate' | 'dueDate' | 'note'
  >,
): ManagementFeePeriodSeedData {
  return {
    ...input,
    pricingMode: 'AREA_UNIFORM',
    unitPrice: LEGACY_MANAGEMENT_FEE_UNIT_PRICE,
    baseAmount: LEGACY_MANAGEMENT_FEE_BASE_AMOUNT,
    defaultArea: DEFAULT_MANAGEMENT_FEE_AREA,
    pricingRuleJson: {
      type: 'AREA_UNIFORM',
      unitPrice: LEGACY_MANAGEMENT_FEE_UNIT_PRICE,
    },
  };
}

export function buildManagementFeeSnapshots(
  pricing: Pick<
    ManagementFeePeriodSeedData,
    'pricingMode' | 'unitPrice' | 'baseAmount' | 'defaultArea' | 'pricingRuleJson'
  >,
  grossArea?: number | null,
) {
  const normalizedArea = round(grossArea ?? pricing.defaultArea);
  const unitPrice =
    pricing.pricingMode === 'AREA_UNIFORM'
      ? round(pricing.unitPrice ?? 0)
      : round(
          ((pricing.pricingRuleJson?.tiers as PricingTier[] | undefined) ?? [
            { minArea: 0, maxArea: null, unitPrice: LEGACY_MANAGEMENT_FEE_UNIT_PRICE },
          ]).find(
            (item) =>
              normalizedArea >= item.minArea &&
              (item.maxArea === null || normalizedArea <= item.maxArea),
          )?.unitPrice ?? 0,
        );
  const baseAmount = round(pricing.baseAmount ?? 0);
  const receivableAmount = round(normalizedArea * unitPrice + baseAmount);

  return {
    grossAreaSnapshot: normalizedArea,
    unitPriceSnapshot: unitPrice,
    baseAmountSnapshot: baseAmount,
    receivableAmount,
  };
}

export async function upsertManagementFeePeriod(
  prisma: PrismaClient,
  data: ManagementFeePeriodSeedData,
) {
  return prisma.managementFeePeriod.upsert({
    where: { periodKey: data.periodKey },
    update: {
      periodMonth: data.periodMonth,
      chargeStartDate: data.chargeStartDate,
      chargeEndDate: data.chargeEndDate,
      dueDate: data.dueDate,
      pricingMode: data.pricingMode,
      unitPrice: data.unitPrice ?? null,
      baseAmount: data.baseAmount,
      defaultArea: data.defaultArea,
      pricingRuleJson: (data.pricingRuleJson ?? Prisma.JsonNull) as Prisma.InputJsonValue,
      note: data.note ?? null,
    },
    create: {
      periodKey: data.periodKey,
      periodMonth: data.periodMonth,
      chargeStartDate: data.chargeStartDate,
      chargeEndDate: data.chargeEndDate,
      dueDate: data.dueDate,
      pricingMode: data.pricingMode,
      unitPrice: data.unitPrice ?? null,
      baseAmount: data.baseAmount,
      defaultArea: data.defaultArea,
      pricingRuleJson: (data.pricingRuleJson ?? Prisma.JsonNull) as Prisma.InputJsonValue,
      note: data.note ?? null,
    },
  });
}
