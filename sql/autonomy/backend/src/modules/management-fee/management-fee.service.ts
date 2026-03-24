import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { AdminAuditContext } from '../audit-log/audit-log.types';
import {
  AdminManagementFeeHouseQueryDto,
  CreateManagementFeePeriodDto,
  ManagementFeePeriodQueryDto,
} from './dto/management-fee.dto';

type PaymentStatus = 'PAID' | 'PARTIAL' | 'PENDING' | 'OVERDUE';
type PricingMode = 'AREA_UNIFORM' | 'AREA_TIERED';

interface PricingTier {
  minArea: number;
  maxArea: number | null;
  unitPrice: number;
}

interface ResolvedPeriod {
  id: string | null;
  periodKey: string;
  periodMonth: string | null;
  chargeStartDate: Date | null;
  chargeEndDate: Date | null;
  dueDate: Date | null;
  pricingMode: PricingMode;
  unitPrice: number | null;
  baseAmount: number;
  defaultArea: number;
  pricingRuleJson: { tiers?: PricingTier[] } | null;
  note?: string | null;
}

interface ManagementFeeHouseRecord {
  id: string;
  periodKey: string;
  periodMonth: string;
  houseId: string;
  buildingId: string;
  buildingName: string;
  displayName: string;
  unitNo: string;
  roomNo: string;
  grossArea: number;
  unitPrice: number;
  baseAmount: number;
  receivableAmount: number;
  paidAmount: number;
  outstandingAmount: number;
  paymentRate: number;
  paymentStatus: PaymentStatus;
  chargeStartDate: string | null;
  chargeEndDate: string | null;
  dueDate: string | null;
  lastPaidAt: string | null;
}

const PAYMENT_STATUS_LABEL_MAP: Record<PaymentStatus, string> = {
  PAID: '已缴清',
  PARTIAL: '部分缴纳',
  PENDING: '待缴纳',
  OVERDUE: '逾期未缴',
};

const LEGACY_UNIT_PRICE = 2.68;
const LEGACY_TIERS: PricingTier[] = [{ minArea: 0, maxArea: null, unitPrice: LEGACY_UNIT_PRICE }];
const LEGACY_PRICING_MODE: PricingMode = 'AREA_UNIFORM';
const UNIFORM_PRICING_MODE: PricingMode = 'AREA_UNIFORM';
const DEFAULT_AREA = 88;
const LEGACY_BASE_AMOUNT = 18;

@Injectable()
export class ManagementFeeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogService: AuditLogService,
  ) {}

  async listPeriods() {
    const periods = await this.prisma.managementFeePeriod.findMany({
      include: {
        records: {
          select: {
            paymentStatus: true,
          },
        },
      },
      orderBy: [{ chargeStartDate: 'desc' }, { chargeEndDate: 'desc' }, { createdAt: 'desc' }],
    });

    if (periods.length > 0) {
      return periods.map((item) => {
        const paidHouseholds = item.records.filter((record) => record.paymentStatus === 'PAID').length;
        const houseCount = item.records.length;

        return {
          periodKey: item.periodKey,
          periodMonth: item.periodMonth,
          chargeStartDate: item.chargeStartDate.toISOString(),
          chargeEndDate: item.chargeEndDate.toISOString(),
          dueDate: item.dueDate.toISOString(),
          pricingMode: item.pricingMode,
          unitPrice: item.unitPrice,
          baseAmount: item.baseAmount,
          defaultArea: item.defaultArea,
          houseCount,
          paidHouseholds,
          unpaidHouseholds: Math.max(houseCount - paidHouseholds, 0),
        };
      });
    }

    return this.listLegacyPeriods();
  }

  async createPeriod(dto: CreateManagementFeePeriodDto, context?: AdminAuditContext) {
    const periodKey = `${dto.chargeStartDate}_${dto.chargeEndDate}`;
    const chargeStartDate = this.createDateTime(dto.chargeStartDate, 'start');
    const chargeEndDate = this.createDateTime(dto.chargeEndDate, 'end');
    const dueDate = this.createDateTime(dto.dueDate, 'end');
    const baseAmount = this.round(dto.baseAmount ?? 0);
    const defaultArea = this.round(dto.defaultArea ?? DEFAULT_AREA);
    const unitPrice = this.round(dto.unitPrice);

    if (chargeEndDate.getTime() < chargeStartDate.getTime()) {
      throw new BadRequestException('管理结束日期不能早于管理开始日期');
    }

    if (dueDate.getTime() < chargeEndDate.getTime()) {
      throw new BadRequestException('截止日期不能早于管理结束日期');
    }

    if (unitPrice < 0) {
      throw new BadRequestException('收费单价不能小于 0');
    }

    const existed = await this.prisma.managementFeePeriod.findUnique({
      where: { periodKey },
      select: { id: true },
    });

    if (existed) {
      throw new BadRequestException('该管理时段已存在');
    }

    const houses = await this.prisma.house.findMany({
      select: {
        id: true,
        grossArea: true,
      },
      orderBy: [{ building: { sortNo: 'asc' } }, { displayName: 'asc' }],
    });

    if (houses.length === 0) {
      throw new BadRequestException('当前没有可初始化的房屋');
    }

    const period = await this.prisma.managementFeePeriod.create({
      data: {
        periodKey,
        periodMonth: dto.chargeStartDate.slice(0, 7),
        chargeStartDate,
        chargeEndDate,
        dueDate,
        pricingMode: UNIFORM_PRICING_MODE,
        unitPrice,
        baseAmount,
        defaultArea,
        pricingRuleJson: {
          type: UNIFORM_PRICING_MODE,
          unitPrice,
        },
        note: dto.note?.trim() || null,
      },
    });

    await this.prisma.managementFeeRecord.createMany({
      data: houses.map((house) => {
        const snapshots = this.buildSnapshots({
          grossArea: house.grossArea,
          pricingMode: UNIFORM_PRICING_MODE,
          unitPrice,
          baseAmount,
          defaultArea,
          pricingRuleJson: null,
        });

        return {
          periodId: period.id,
          periodKey: period.periodKey,
          periodMonth: period.periodMonth,
          houseId: house.id,
          chargeStartDate,
          chargeEndDate,
          dueDate,
          grossAreaSnapshot: snapshots.grossArea,
          unitPriceSnapshot: snapshots.unitPrice,
          baseAmountSnapshot: snapshots.baseAmount,
          receivableAmount: snapshots.receivableAmount,
          paidAmount: 0,
          paymentStatus: 'PENDING',
          source: 'manual_create',
          note: '管理时段初始化账目',
        };
      }),
    });

    const periods = await this.listPeriods();
    const created = periods.find((item) => item.periodKey === periodKey);
    if (created) {
      await this.auditLogService.recordAdminAction({
        context,
        action: 'CREATE',
        resourceType: 'MANAGEMENT_FEE_PERIOD',
        resourceId: period.id,
        resourceName: `${period.periodKey} 管理时段`,
        snapshot: {
          after: created,
        },
      });
      return created;
    }

    const fallbackCreated = {
      periodKey: period.periodKey,
      periodMonth: period.periodMonth,
      chargeStartDate: period.chargeStartDate.toISOString(),
      chargeEndDate: period.chargeEndDate.toISOString(),
      dueDate: period.dueDate.toISOString(),
      pricingMode: period.pricingMode,
      unitPrice: period.unitPrice,
      baseAmount: period.baseAmount,
      defaultArea: period.defaultArea,
      houseCount: houses.length,
      paidHouseholds: 0,
      unpaidHouseholds: houses.length,
    };

    await this.auditLogService.recordAdminAction({
      context,
      action: 'CREATE',
      resourceType: 'MANAGEMENT_FEE_PERIOD',
      resourceId: period.id,
      resourceName: `${period.periodKey} 管理时段`,
      snapshot: {
        after: fallbackCreated,
      },
    });

    return fallbackCreated;
  }

  async getAdminSummary(query: ManagementFeePeriodQueryDto) {
    const period = await this.resolvePeriod(query);
    const records = await this.loadHouseRecords(period);

    return {
      periodKey: period.periodKey,
      periodMonth: period.periodMonth,
      calculationRule: this.getCalculationRule(period),
      ...this.buildSummary(records, period),
      updatedAt: new Date().toISOString(),
    };
  }

  async listAdminHouses(query: AdminManagementFeeHouseQueryDto) {
    const period = await this.resolvePeriod(query);
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const skip = (page - 1) * pageSize;
    const keyword = query.keyword?.trim().toLowerCase();
    const paymentStatus = query.paymentStatus?.trim().toUpperCase() as PaymentStatus | undefined;

    let records = await this.loadHouseRecords(period);

    if (query.buildingId?.trim()) {
      records = records.filter((item) => item.buildingId === query.buildingId?.trim());
    }

    if (paymentStatus && ['PAID', 'PARTIAL', 'PENDING', 'OVERDUE'].includes(paymentStatus)) {
      records = records.filter((item) => item.paymentStatus === paymentStatus);
    }

    if (keyword) {
      records = records.filter((item) =>
        [item.buildingName, item.displayName, item.roomNo, item.unitNo]
          .filter(Boolean)
          .some((text) => text.toLowerCase().includes(keyword)),
      );
    }

    const items = records.slice(skip, skip + pageSize);

    return {
      items: items.map((item) => ({
        ...item,
        paymentStatusLabel: PAYMENT_STATUS_LABEL_MAP[item.paymentStatus],
      })),
      total: records.length,
      page,
      pageSize,
      periodKey: period.periodKey,
      periodMonth: period.periodMonth,
    };
  }

  async getAdminBuildingStats(query: ManagementFeePeriodQueryDto) {
    const period = await this.resolvePeriod(query);
    const records = await this.loadHouseRecords(period);
    const buildingMap = new Map<
      string,
      {
        buildingId: string;
        buildingName: string;
        houseCount: number;
        receivableAmount: number;
        paidAmount: number;
        outstandingAmount: number;
        paidHouseCount: number;
      }
    >();

    for (const item of records) {
      const current =
        buildingMap.get(item.buildingId) ??
        {
          buildingId: item.buildingId,
          buildingName: item.buildingName,
          houseCount: 0,
          receivableAmount: 0,
          paidAmount: 0,
          outstandingAmount: 0,
          paidHouseCount: 0,
        };

      current.houseCount += 1;
      current.receivableAmount += item.receivableAmount;
      current.paidAmount += item.paidAmount;
      current.outstandingAmount += item.outstandingAmount;
      if (item.paymentStatus === 'PAID') {
        current.paidHouseCount += 1;
      }

      buildingMap.set(item.buildingId, current);
    }

    return {
      periodKey: period.periodKey,
      periodMonth: period.periodMonth,
      chargeStartDate: period.chargeStartDate ? period.chargeStartDate.toISOString() : null,
      chargeEndDate: period.chargeEndDate ? period.chargeEndDate.toISOString() : null,
      dueDate: period.dueDate ? period.dueDate.toISOString() : null,
      items: Array.from(buildingMap.values())
        .map((item) => ({
          ...item,
          receivableAmount: this.round(item.receivableAmount),
          paidAmount: this.round(item.paidAmount),
          outstandingAmount: this.round(item.outstandingAmount),
          paymentRate:
            item.receivableAmount > 0
              ? this.round((item.paidAmount / item.receivableAmount) * 100)
              : 0,
          paidHouseRate:
            item.houseCount > 0 ? this.round((item.paidHouseCount / item.houseCount) * 100) : 0,
        }))
        .sort((a, b) => a.buildingName.localeCompare(b.buildingName, 'zh-CN')),
      updatedAt: new Date().toISOString(),
    };
  }

  async getDisclosure(query: ManagementFeePeriodQueryDto) {
    const period = await this.resolvePeriod(query);
    const records = await this.loadHouseRecords(period);
    const summary = this.buildSummary(records, period);
    const buildings = await this.getAdminBuildingStats({ periodKey: period.periodKey });

    return {
      periodKey: period.periodKey,
      periodMonth: period.periodMonth,
      title: `${this.getRangeLabel(period.chargeStartDate, period.chargeEndDate, period.periodMonth)} 管理费缴纳公开`,
      publisher: '物业财务与信息公开组',
      calculationRule: this.getCalculationRule(period),
      summary,
      buildingStats: buildings.items,
      publishedAt: new Date().toISOString(),
      note: '当前公开数据来自管理时段配置和房屋账目快照，用于公开展示与缴费统计。',
    };
  }

  async getDisclosureTree(query: ManagementFeePeriodQueryDto) {
    const listedPeriods: Array<{
      periodKey: string;
      periodMonth: string | null;
      chargeStartDate: string | null;
      chargeEndDate: string | null;
      dueDate: string | null;
      pricingMode: PricingMode;
      unitPrice: number | null;
      baseAmount: number;
      defaultArea: number;
      houseCount: number;
      paidHouseholds: number;
      unpaidHouseholds: number;
    }> = (await this.listPeriods()).map((item) => ({
      periodKey: item.periodKey,
      periodMonth: item.periodMonth ?? null,
      chargeStartDate: item.chargeStartDate ?? null,
      chargeEndDate: item.chargeEndDate ?? null,
      dueDate: item.dueDate ?? null,
      pricingMode: item.pricingMode as PricingMode,
      unitPrice: item.unitPrice ?? null,
      baseAmount: item.baseAmount,
      defaultArea: item.defaultArea,
      houseCount: item.houseCount,
      paidHouseholds: item.paidHouseholds,
      unpaidHouseholds: item.unpaidHouseholds,
    }));
    let matchedPeriods = listedPeriods;

    if (query.periodKey?.trim()) {
      matchedPeriods = matchedPeriods.filter((item) => item.periodKey === query.periodKey?.trim());
    }

    if (query.periodMonth?.trim()) {
      matchedPeriods = matchedPeriods.filter((item) => item.periodMonth === query.periodMonth?.trim());
    }

    if (!matchedPeriods.length && (query.periodKey?.trim() || query.periodMonth?.trim())) {
      const resolved = await this.resolvePeriod(query);
      matchedPeriods = [
        {
          periodKey: resolved.periodKey,
          periodMonth: resolved.periodMonth ?? null,
          chargeStartDate: resolved.chargeStartDate ? resolved.chargeStartDate.toISOString() : null,
          chargeEndDate: resolved.chargeEndDate ? resolved.chargeEndDate.toISOString() : null,
          dueDate: resolved.dueDate ? resolved.dueDate.toISOString() : null,
          pricingMode: resolved.pricingMode,
          unitPrice: resolved.unitPrice,
          baseAmount: resolved.baseAmount,
          defaultArea: resolved.defaultArea,
          houseCount: 0,
          paidHouseholds: 0,
          unpaidHouseholds: 0,
        },
      ];
    }

    const periods = [];

    for (const item of matchedPeriods) {
      const period = await this.resolvePeriod({ periodKey: item.periodKey });
      const records = await this.loadHouseRecords(period);
      const summary = this.buildSummary(records, period);
      const buildings = this.buildDisclosureBuildings(records);

      periods.push({
        periodKey: period.periodKey,
        periodMonth: period.periodMonth,
        title: `${this.getRangeLabel(period.chargeStartDate, period.chargeEndDate, period.periodMonth)} 绠＄悊璐圭即绾冲叕寮€`,
        rangeLabel: this.getRangeLabel(period.chargeStartDate, period.chargeEndDate, period.periodMonth),
        chargeStartDate: period.chargeStartDate ? period.chargeStartDate.toISOString() : null,
        chargeEndDate: period.chargeEndDate ? period.chargeEndDate.toISOString() : null,
        dueDate: period.dueDate ? period.dueDate.toISOString() : null,
        buildingCount: buildings.length,
        summary: {
          ...summary,
          unpaidHouseholds: Math.max(summary.houseCount - summary.paidHouseholds, 0),
        },
        buildings,
      });
    }

    const summary = this.buildDisclosureTreeSummary(periods);
    const buildingOptions = Array.from(
      new Map(
        periods
          .flatMap((item) => item.buildings)
          .map((item) => [item.buildingId, { buildingId: item.buildingId, buildingName: item.buildingName }]),
      ).values(),
    ).sort((a, b) => a.buildingName.localeCompare(b.buildingName, 'zh-CN'));

    return {
      title: '鏀惰垂鍏紑',
      publisher: '鐗╀笟璐㈠姟涓庝俊鎭叕寮€缁?',
      note: '褰撳墠鍏紑鏁版嵁鎸夎处鏈熴€佹ゼ鏍嬩笌鎴垮眿缁撴瀯灞曠ず锛岀敤浜庡叕绀鸿处鍗曟墽琛屼笌缂寸撼鎯呭喌銆?',
      summary,
      buildingOptions,
      periods,
      updatedAt: new Date().toISOString(),
    };
  }

  async listBuildingOptions(query?: ManagementFeePeriodQueryDto) {
    const period = await this.resolvePeriod(query);

    return this.prisma.building.findMany({
      where: {
        houses: {
          some: {
            managementFeeRecords: {
              some: this.getPeriodRecordWhere(period),
            },
          },
        },
      },
      orderBy: [{ sortNo: 'asc' }, { buildingName: 'asc' }],
      select: {
        id: true,
        buildingName: true,
        buildingCode: true,
        sortNo: true,
        status: true,
      },
    });
  }

  async updateHousePaymentStatus(id: string, paymentStatus: PaymentStatus, context?: AdminAuditContext) {
    const existed = await this.prisma.managementFeeRecord.findUnique({
      where: { id },
      include: {
        period: true,
        house: {
          include: {
            building: true,
          },
        },
      },
    });

    if (!existed) {
      throw new NotFoundException('管理费记录不存在');
    }

    const currentRecord = this.mapRecord(existed);
    const paidAt =
      paymentStatus === 'PAID' || paymentStatus === 'PARTIAL' ? existed.paidAt ?? new Date() : null;
    const paidAmount =
      paymentStatus === 'PAID'
        ? currentRecord.receivableAmount
        : paymentStatus === 'PARTIAL'
          ? this.round(currentRecord.receivableAmount / 2)
          : 0;

    const updated = await this.prisma.managementFeeRecord.update({
      where: { id },
      data: {
        paymentStatus,
        paidAt,
        paidAmount,
      },
      include: {
        period: true,
        house: {
          include: {
            building: true,
          },
        },
      },
    });

    const record = this.mapRecord(updated);
    await this.auditLogService.recordAdminAction({
      context,
      action: 'STATUS_UPDATE',
      resourceType: 'MANAGEMENT_FEE_RECORD',
      resourceId: id,
      resourceName: `${record.buildingName} ${record.displayName}`,
      snapshot: {
        before: {
          paymentStatus: currentRecord.paymentStatus,
          paidAmount: currentRecord.paidAmount,
          outstandingAmount: currentRecord.outstandingAmount,
          periodKey: currentRecord.periodKey,
          houseId: currentRecord.houseId,
        },
        after: {
          paymentStatus: record.paymentStatus,
          paidAmount: record.paidAmount,
          outstandingAmount: record.outstandingAmount,
          periodKey: record.periodKey,
          houseId: record.houseId,
        },
      },
    });

    return {
      ...record,
      paymentStatusLabel: PAYMENT_STATUS_LABEL_MAP[record.paymentStatus],
    };
  }

  private async loadHouseRecords(period: ResolvedPeriod): Promise<ManagementFeeHouseRecord[]> {
    const records = await this.prisma.managementFeeRecord.findMany({
      where: this.getPeriodRecordWhere(period),
      include: {
        period: true,
        house: {
          include: {
            building: true,
          },
        },
      },
      orderBy: [{ house: { building: { sortNo: 'asc' } } }, { house: { displayName: 'asc' } }],
    });

    return records.map((record) => this.mapRecord(record, period));
  }

  private mapRecord(record: any, fallbackPeriod?: ResolvedPeriod): ManagementFeeHouseRecord {
    const period = this.normalizePeriod(record.period, {
      periodKey: record.periodKey,
      periodMonth: record.periodMonth,
      chargeStartDate: record.chargeStartDate,
      chargeEndDate: record.chargeEndDate,
      dueDate: record.dueDate,
    }, fallbackPeriod);
    const snapshots = this.buildSnapshots(
      {
        grossArea: record.house?.grossArea,
        pricingMode: period.pricingMode,
        unitPrice: period.unitPrice,
        baseAmount: period.baseAmount,
        defaultArea: period.defaultArea,
        pricingRuleJson: period.pricingRuleJson,
      },
      {
        grossArea: record.grossAreaSnapshot,
        unitPrice: record.unitPriceSnapshot,
        baseAmount: record.baseAmountSnapshot,
        receivableAmount: record.receivableAmount,
      },
    );
    const paymentStatus = (record.paymentStatus as PaymentStatus) ?? 'PENDING';
    const paidAmount =
      record.paidAmount === null || record.paidAmount === undefined
        ? paymentStatus === 'PAID'
          ? snapshots.receivableAmount
          : paymentStatus === 'PARTIAL'
            ? this.round(snapshots.receivableAmount / 2)
            : 0
        : this.round(Number(record.paidAmount));
    const outstandingAmount = this.round(Math.max(snapshots.receivableAmount - paidAmount, 0));
    const paymentRate =
      snapshots.receivableAmount > 0
        ? this.round((paidAmount / snapshots.receivableAmount) * 100)
        : 0;

    return {
      id: record.id,
      periodKey: period.periodKey,
      periodMonth: period.periodMonth ?? record.periodMonth ?? '',
      houseId: record.houseId,
      buildingId: record.house.buildingId,
      buildingName: record.house.building.buildingName,
      displayName: record.house.displayName,
      unitNo: record.house.unitNo,
      roomNo: record.house.roomNo,
      grossArea: snapshots.grossArea,
      unitPrice: snapshots.unitPrice,
      baseAmount: snapshots.baseAmount,
      receivableAmount: snapshots.receivableAmount,
      paidAmount,
      outstandingAmount,
      paymentRate,
      paymentStatus,
      chargeStartDate: period.chargeStartDate ? period.chargeStartDate.toISOString() : null,
      chargeEndDate: period.chargeEndDate ? period.chargeEndDate.toISOString() : null,
      dueDate: period.dueDate ? period.dueDate.toISOString() : null,
      lastPaidAt: record.paidAt ? new Date(record.paidAt).toISOString() : null,
    };
  }

  private buildSummary(records: ManagementFeeHouseRecord[], period: ResolvedPeriod) {
    const receivableAmount = records.reduce((sum, item) => sum + item.receivableAmount, 0);
    const paidAmount = records.reduce((sum, item) => sum + item.paidAmount, 0);
    const outstandingAmount = records.reduce((sum, item) => sum + item.outstandingAmount, 0);
    const paidHouseholds = records.filter((item) => item.paymentStatus === 'PAID').length;
    const partialHouseholds = records.filter((item) => item.paymentStatus === 'PARTIAL').length;
    const overdueHouseholds = records.filter((item) => item.paymentStatus === 'OVERDUE').length;

    return {
      chargeStartDate: period.chargeStartDate ? period.chargeStartDate.toISOString() : null,
      chargeEndDate: period.chargeEndDate ? period.chargeEndDate.toISOString() : null,
      dueDate: period.dueDate ? period.dueDate.toISOString() : null,
      houseCount: records.length,
      receivableAmount: this.round(receivableAmount),
      paidAmount: this.round(paidAmount),
      outstandingAmount: this.round(outstandingAmount),
      paymentRate: receivableAmount > 0 ? this.round((paidAmount / receivableAmount) * 100) : 0,
      paidHouseholds,
      partialHouseholds,
      overdueHouseholds,
    };
  }

  private buildDisclosureBuildings(records: ManagementFeeHouseRecord[]) {
    const buildingMap = new Map<
      string,
      {
        buildingId: string;
        buildingName: string;
        houseCount: number;
        receivableAmount: number;
        paidAmount: number;
        outstandingAmount: number;
        paidHouseholds: number;
        partialHouseholds: number;
        overdueHouseholds: number;
        houses: Array<{
          id: string;
          houseId: string;
          displayName: string;
          unitNo: string;
          roomNo: string;
          grossArea: number;
          receivableAmount: number;
          paidAmount: number;
          outstandingAmount: number;
          paymentRate: number;
          paymentStatus: PaymentStatus;
          paymentStatusLabel: string;
          lastPaidAt: string | null;
        }>;
      }
    >();

    for (const item of records) {
      const current =
        buildingMap.get(item.buildingId) ??
        {
          buildingId: item.buildingId,
          buildingName: item.buildingName,
          houseCount: 0,
          receivableAmount: 0,
          paidAmount: 0,
          outstandingAmount: 0,
          paidHouseholds: 0,
          partialHouseholds: 0,
          overdueHouseholds: 0,
          houses: [],
        };

      current.houseCount += 1;
      current.receivableAmount += item.receivableAmount;
      current.paidAmount += item.paidAmount;
      current.outstandingAmount += item.outstandingAmount;

      if (item.paymentStatus === 'PAID') {
        current.paidHouseholds += 1;
      } else if (item.paymentStatus === 'PARTIAL') {
        current.partialHouseholds += 1;
      } else if (item.paymentStatus === 'OVERDUE') {
        current.overdueHouseholds += 1;
      }

      current.houses.push({
        id: item.id,
        houseId: item.houseId,
        displayName: item.displayName,
        unitNo: item.unitNo,
        roomNo: item.roomNo,
        grossArea: item.grossArea,
        receivableAmount: item.receivableAmount,
        paidAmount: item.paidAmount,
        outstandingAmount: item.outstandingAmount,
        paymentRate: item.paymentRate,
        paymentStatus: item.paymentStatus,
        paymentStatusLabel: PAYMENT_STATUS_LABEL_MAP[item.paymentStatus],
        lastPaidAt: item.lastPaidAt,
      });

      buildingMap.set(item.buildingId, current);
    }

    return Array.from(buildingMap.values())
      .map((item) => ({
        ...item,
        receivableAmount: this.round(item.receivableAmount),
        paidAmount: this.round(item.paidAmount),
        outstandingAmount: this.round(item.outstandingAmount),
        unpaidHouseholds: Math.max(item.houseCount - item.paidHouseholds, 0),
        paymentRate: item.receivableAmount > 0 ? this.round((item.paidAmount / item.receivableAmount) * 100) : 0,
      }))
      .sort((a, b) => a.buildingName.localeCompare(b.buildingName, 'zh-CN'));
  }

  private buildDisclosureTreeSummary(
    periods: Array<{
      summary: {
        houseCount: number;
        receivableAmount: number;
        paidAmount: number;
        outstandingAmount: number;
        paidHouseholds: number;
        partialHouseholds: number;
        overdueHouseholds: number;
      };
    }>,
  ) {
    const aggregated = periods.reduce(
      (result, item) => {
        result.periodCount += 1;
        result.houseCount += item.summary.houseCount;
        result.receivableAmount += item.summary.receivableAmount;
        result.paidAmount += item.summary.paidAmount;
        result.outstandingAmount += item.summary.outstandingAmount;
        result.paidHouseholds += item.summary.paidHouseholds;
        result.partialHouseholds += item.summary.partialHouseholds;
        result.overdueHouseholds += item.summary.overdueHouseholds;
        return result;
      },
      {
        periodCount: 0,
        houseCount: 0,
        receivableAmount: 0,
        paidAmount: 0,
        outstandingAmount: 0,
        paidHouseholds: 0,
        partialHouseholds: 0,
        overdueHouseholds: 0,
      },
    );

    return {
      ...aggregated,
      receivableAmount: this.round(aggregated.receivableAmount),
      paidAmount: this.round(aggregated.paidAmount),
      outstandingAmount: this.round(aggregated.outstandingAmount),
      unpaidHouseholds: Math.max(aggregated.houseCount - aggregated.paidHouseholds, 0),
      paymentRate:
        aggregated.receivableAmount > 0
          ? this.round((aggregated.paidAmount / aggregated.receivableAmount) * 100)
          : 0,
    };
  }

  private getCalculationRule(period?: ResolvedPeriod) {
    const normalized = this.normalizePeriod(period, {});
    const tiers = this.getPricingTiers(normalized);

    return {
      version: normalized.pricingMode === UNIFORM_PRICING_MODE ? 'period-rule-uniform-v1' : 'period-rule-tiered-v1',
      pricingMode: normalized.pricingMode,
      unitPrice: normalized.unitPrice,
      baseAmount: normalized.baseAmount,
      defaultArea: normalized.defaultArea,
      description:
        normalized.pricingMode === UNIFORM_PRICING_MODE
          ? `当前账期按统一单价每平方米 ${normalized.unitPrice?.toFixed(2) ?? '0.00'} 元计算，固定费用 ${normalized.baseAmount.toFixed(2)} 元。`
          : '当前账期按统一单价加固定费用计算。',
      tiers,
    };
  }

  private getPricingTiers(period: ResolvedPeriod) {
    if (period.pricingMode === UNIFORM_PRICING_MODE) {
      return [
        {
          minArea: 0,
          maxArea: null,
          unitPrice: this.round(period.unitPrice ?? 0),
        },
      ];
    }

    const tiers = Array.isArray(period.pricingRuleJson?.tiers) ? period.pricingRuleJson?.tiers : LEGACY_TIERS;

    return tiers.map((item) => ({
      minArea: this.round(item.minArea),
      maxArea: item.maxArea === null ? null : this.round(item.maxArea),
      unitPrice: this.round(item.unitPrice),
    }));
  }

  private buildSnapshots(
    period: Pick<ResolvedPeriod, 'pricingMode' | 'unitPrice' | 'baseAmount' | 'defaultArea' | 'pricingRuleJson'> & {
      grossArea?: number | null;
    },
    existing?: {
      grossArea?: number | null;
      unitPrice?: number | null;
      baseAmount?: number | null;
      receivableAmount?: number | null;
    },
  ) {
    const grossArea = this.round(existing?.grossArea ?? period.grossArea ?? period.defaultArea ?? DEFAULT_AREA);
    const unitPrice = this.round(
      existing?.unitPrice ??
        this.resolveUnitPrice(grossArea, {
          pricingMode: period.pricingMode,
          unitPrice: period.unitPrice,
          pricingRuleJson: period.pricingRuleJson,
        }),
    );
    const baseAmount = this.round(existing?.baseAmount ?? period.baseAmount ?? 0);
    const receivableAmount = this.round(
      existing?.receivableAmount ?? grossArea * unitPrice + baseAmount,
    );

    return {
      grossArea,
      unitPrice,
      baseAmount,
      receivableAmount,
    };
  }

  private resolveUnitPrice(
    grossArea: number,
    period: Pick<ResolvedPeriod, 'pricingMode' | 'unitPrice' | 'pricingRuleJson'>,
  ) {
    if (period.pricingMode === UNIFORM_PRICING_MODE) {
      return period.unitPrice ?? 0;
    }

    const tiers = Array.isArray(period.pricingRuleJson?.tiers)
      ? period.pricingRuleJson?.tiers
      : LEGACY_TIERS;
    const matched = tiers.find(
      (item) => grossArea >= item.minArea && (item.maxArea === null || grossArea <= item.maxArea),
    );

    return matched?.unitPrice ?? period.unitPrice ?? LEGACY_UNIT_PRICE;
  }

  private normalizePeriod(
    rawPeriod?:
      | {
          id?: string | null;
          periodKey?: string | null;
          periodMonth?: string | null;
          chargeStartDate?: Date | string | null;
          chargeEndDate?: Date | string | null;
          dueDate?: Date | string | null;
          pricingMode?: string | PricingMode | null;
          unitPrice?: number | null;
          baseAmount?: number | null;
          defaultArea?: number | null;
          pricingRuleJson?: unknown;
          note?: string | null;
        }
      | null,
    legacy?: {
      periodKey?: string | null;
      periodMonth?: string | null;
      chargeStartDate?: Date | string | null;
      chargeEndDate?: Date | string | null;
      dueDate?: Date | string | null;
    },
    fallback?: ResolvedPeriod,
  ): ResolvedPeriod {
    if (rawPeriod?.periodKey) {
      return {
        id: rawPeriod.id ?? null,
        periodKey: rawPeriod.periodKey,
        periodMonth: rawPeriod.periodMonth ?? legacy?.periodMonth ?? fallback?.periodMonth ?? null,
        chargeStartDate: this.toDate(rawPeriod.chargeStartDate) ?? this.toDate(legacy?.chargeStartDate) ?? fallback?.chargeStartDate ?? null,
        chargeEndDate: this.toDate(rawPeriod.chargeEndDate) ?? this.toDate(legacy?.chargeEndDate) ?? fallback?.chargeEndDate ?? null,
        dueDate: this.toDate(rawPeriod.dueDate) ?? this.toDate(legacy?.dueDate) ?? fallback?.dueDate ?? null,
        pricingMode: (rawPeriod.pricingMode as PricingMode) ?? LEGACY_PRICING_MODE,
        unitPrice:
          rawPeriod.unitPrice === null || rawPeriod.unitPrice === undefined
            ? null
            : this.round(Number(rawPeriod.unitPrice)),
        baseAmount:
          rawPeriod.baseAmount === null || rawPeriod.baseAmount === undefined
            ? LEGACY_BASE_AMOUNT
            : this.round(Number(rawPeriod.baseAmount)),
        defaultArea:
          rawPeriod.defaultArea === null || rawPeriod.defaultArea === undefined
            ? DEFAULT_AREA
            : this.round(Number(rawPeriod.defaultArea)),
        pricingRuleJson: (rawPeriod.pricingRuleJson as { tiers?: PricingTier[] } | null) ?? null,
        note: rawPeriod.note ?? null,
      };
    }

    if (fallback) {
      return fallback;
    }

    return {
      id: null,
      periodKey: legacy?.periodKey ?? '',
      periodMonth: legacy?.periodMonth ?? null,
      chargeStartDate: this.toDate(legacy?.chargeStartDate),
      chargeEndDate: this.toDate(legacy?.chargeEndDate),
      dueDate: this.toDate(legacy?.dueDate),
      pricingMode: LEGACY_PRICING_MODE,
      unitPrice: null,
      baseAmount: LEGACY_BASE_AMOUNT,
      defaultArea: DEFAULT_AREA,
      pricingRuleJson: { tiers: LEGACY_TIERS },
      note: null,
    };
  }

  private async resolvePeriod(query?: ManagementFeePeriodQueryDto | AdminManagementFeeHouseQueryDto) {
    const periodKey = query?.periodKey?.trim();
    if (periodKey && /^\d{4}-\d{2}-\d{2}_\d{4}-\d{2}-\d{2}$/.test(periodKey)) {
      const matched = await this.prisma.managementFeePeriod.findUnique({
        where: { periodKey },
      });
      if (matched) {
        return this.normalizePeriod(matched);
      }

      const legacyMatched = await this.findLegacyPeriod({ periodKey });
      if (legacyMatched) {
        return legacyMatched;
      }
    }

    const periodMonth = query?.periodMonth?.trim();
    if (periodMonth && /^\d{4}-\d{2}$/.test(periodMonth)) {
      const matched = await this.prisma.managementFeePeriod.findFirst({
        where: { periodMonth },
        orderBy: [{ chargeStartDate: 'desc' }, { chargeEndDate: 'desc' }, { createdAt: 'desc' }],
      });

      if (matched) {
        return this.normalizePeriod(matched);
      }

      const legacyMatched = await this.findLegacyPeriod({ periodMonth });
      if (legacyMatched) {
        return legacyMatched;
      }
    }

    const latest = await this.prisma.managementFeePeriod.findFirst({
      orderBy: [{ chargeStartDate: 'desc' }, { chargeEndDate: 'desc' }, { createdAt: 'desc' }],
    });

    if (latest) {
      return this.normalizePeriod(latest);
    }

    const legacyLatest = await this.findLegacyPeriod({});
    if (legacyLatest) {
      return legacyLatest;
    }

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = '01';
    return this.normalizePeriod(undefined, {
      periodKey: `${year}-${month}-${day}_${year}-${month}-${day}`,
      periodMonth: `${year}-${month}`,
      chargeStartDate: now,
      chargeEndDate: now,
      dueDate: now,
    });
  }

  private async findLegacyPeriod(query: { periodKey?: string; periodMonth?: string }) {
    const matched = await this.prisma.managementFeeRecord.findFirst({
      where: query.periodKey
        ? { periodKey: query.periodKey }
        : query.periodMonth
          ? { periodMonth: query.periodMonth }
          : undefined,
      orderBy: [{ chargeStartDate: 'desc' }, { chargeEndDate: 'desc' }, { createdAt: 'desc' }],
      select: {
        periodKey: true,
        periodMonth: true,
        chargeStartDate: true,
        chargeEndDate: true,
        dueDate: true,
      },
    });

    if (!matched?.periodKey) {
      return null;
    }

    return this.normalizePeriod(undefined, matched);
  }

  private async listLegacyPeriods() {
    const records = await this.prisma.managementFeeRecord.findMany({
      select: {
        periodKey: true,
        periodMonth: true,
        chargeStartDate: true,
        chargeEndDate: true,
        dueDate: true,
        paymentStatus: true,
      },
      orderBy: [{ chargeStartDate: 'desc' }, { chargeEndDate: 'desc' }, { createdAt: 'desc' }],
    });

    const periodMap = new Map<
      string,
      {
        periodKey: string;
        periodMonth: string;
        chargeStartDate: string | null;
        chargeEndDate: string | null;
        dueDate: string | null;
        houseCount: number;
        paidHouseholds: number;
      }
    >();

    for (const item of records) {
      const current =
        periodMap.get(item.periodKey) ??
        {
          periodKey: item.periodKey,
          periodMonth: item.periodMonth,
          chargeStartDate: item.chargeStartDate ? new Date(item.chargeStartDate).toISOString() : null,
          chargeEndDate: item.chargeEndDate ? new Date(item.chargeEndDate).toISOString() : null,
          dueDate: item.dueDate ? new Date(item.dueDate).toISOString() : null,
          houseCount: 0,
          paidHouseholds: 0,
        };

      current.houseCount += 1;
      if (item.paymentStatus === 'PAID') {
        current.paidHouseholds += 1;
      }

      periodMap.set(item.periodKey, current);
    }

    return Array.from(periodMap.values()).map((item) => ({
      ...item,
      pricingMode: LEGACY_PRICING_MODE,
      unitPrice: null,
      baseAmount: LEGACY_BASE_AMOUNT,
      defaultArea: DEFAULT_AREA,
      unpaidHouseholds: Math.max(item.houseCount - item.paidHouseholds, 0),
    }));
  }

  private getPeriodRecordWhere(period: ResolvedPeriod) {
    if (period.id) {
      return {
        OR: [{ periodId: period.id }, { periodKey: period.periodKey }],
      };
    }

    return {
      periodKey: period.periodKey,
    };
  }

  private getRangeLabel(start?: Date | null, end?: Date | null, fallbackMonth?: string | null) {
    if (start && end) {
      return `${start.toISOString().slice(0, 10)} 至 ${end.toISOString().slice(0, 10)}`;
    }
    return fallbackMonth ?? '当前账期';
  }

  private createDateTime(dateText: string, mode: 'start' | 'end') {
    const suffix = mode === 'start' ? 'T00:00:00+08:00' : 'T23:59:59+08:00';
    const parsed = new Date(`${dateText}${suffix}`);

    if (Number.isNaN(parsed.getTime())) {
      throw new BadRequestException('管理时段日期无效');
    }

    return parsed;
  }

  private toDate(value?: Date | string | null) {
    if (!value) {
      return null;
    }

    const parsed = value instanceof Date ? value : new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  private round(value: number) {
    return Math.round(value * 100) / 100;
  }
}
