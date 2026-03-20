import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  AdminManagementFeeHouseQueryDto,
  ManagementFeePeriodQueryDto,
} from './dto/management-fee.dto';

type PaymentStatus = 'PAID' | 'PARTIAL' | 'PENDING' | 'OVERDUE';

interface ManagementFeeHouseRecord {
  id: string;
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

const DEFAULT_AREA = 88;
const BASE_AMOUNT = 18;

@Injectable()
export class ManagementFeeService {
  constructor(private readonly prisma: PrismaService) {}

  async getAdminSummary(query: ManagementFeePeriodQueryDto) {
    const periodMonth = await this.resolvePeriodMonth(query.periodMonth);
    const records = await this.loadHouseRecords(periodMonth);

    return {
      periodMonth,
      calculationRule: this.getCalculationRule(),
      ...this.buildSummary(records),
      updatedAt: new Date().toISOString(),
    };
  }

  async listAdminHouses(query: AdminManagementFeeHouseQueryDto) {
    const periodMonth = await this.resolvePeriodMonth(query.periodMonth);
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const skip = (page - 1) * pageSize;
    const keyword = query.keyword?.trim().toLowerCase();
    const paymentStatus = query.paymentStatus?.trim().toUpperCase() as PaymentStatus | undefined;

    let records = await this.loadHouseRecords(periodMonth);

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
      periodMonth,
    };
  }

  async getAdminBuildingStats(query: ManagementFeePeriodQueryDto) {
    const periodMonth = await this.resolvePeriodMonth(query.periodMonth);
    const records = await this.loadHouseRecords(periodMonth);
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
      periodMonth,
      chargeStartDate: records[0]?.chargeStartDate ?? null,
      chargeEndDate: records[0]?.chargeEndDate ?? null,
      dueDate: records[0]?.dueDate ?? null,
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
    const periodMonth = await this.resolvePeriodMonth(query.periodMonth);
    const records = await this.loadHouseRecords(periodMonth);
    const summary = this.buildSummary(records);
    const buildings = await this.getAdminBuildingStats({ periodMonth });

    return {
      periodMonth,
      title: `${periodMonth} 管理费缴纳公开`,
      publisher: '物业财务与信息公开组',
      calculationRule: this.getCalculationRule(),
      summary,
      buildingStats: buildings.items,
      publishedAt: new Date().toISOString(),
      note: '当前公开数据来自人工核对导入的楼栋缴费公示，仅用于信息统计与公开展示。',
    };
  }

  async listBuildingOptions() {
    const periodMonth = await this.resolvePeriodMonth(undefined);
    const records = await this.prisma.managementFeeRecord.findMany({
      where: { periodMonth },
      select: {
        house: {
          select: {
            building: {
              select: {
                id: true,
                buildingName: true,
                buildingCode: true,
                sortNo: true,
                status: true,
              },
            },
          },
        },
      },
      orderBy: {
        house: {
          building: {
            sortNo: 'asc',
          },
        },
      },
    });

    const seen = new Set<string>();
    const items: Array<{
      id: string;
      buildingName: string;
      buildingCode: string;
      sortNo: number | null;
      status: string;
    }> = [];

    for (const item of records) {
      const building = item.house.building;
      if (seen.has(building.id)) {
        continue;
      }
      seen.add(building.id);
      items.push(building);
    }

    return items;
  }

  private async loadHouseRecords(periodMonth: string): Promise<ManagementFeeHouseRecord[]> {
    const records = await this.prisma.managementFeeRecord.findMany({
      where: { periodMonth },
      include: {
        house: {
          include: {
            building: true,
          },
        },
      },
      orderBy: [{ house: { building: { sortNo: 'asc' } } }, { house: { displayName: 'asc' } }],
    });

    return records.map((record) => this.mapRecord(record, periodMonth));
  }

  private mapRecord(record: any, periodMonth: string): ManagementFeeHouseRecord {
    const grossArea = this.round(record.house.grossArea ?? DEFAULT_AREA);
    const unitPrice = this.getUnitPrice(grossArea);
    const receivableAmount = this.round(grossArea * unitPrice + BASE_AMOUNT);
    const paymentStatus = (record.paymentStatus as PaymentStatus) ?? 'PENDING';
    const paidAmount = paymentStatus === 'PAID' ? receivableAmount : 0;
    const outstandingAmount = this.round(Math.max(receivableAmount - paidAmount, 0));
    const paymentRate = receivableAmount > 0 ? this.round((paidAmount / receivableAmount) * 100) : 0;

    return {
      id: record.id,
      houseId: record.houseId,
      buildingId: record.house.buildingId,
      buildingName: record.house.building.buildingName,
      displayName: record.house.displayName,
      unitNo: record.house.unitNo,
      roomNo: record.house.roomNo,
      grossArea,
      unitPrice,
      baseAmount: BASE_AMOUNT,
      receivableAmount,
      paidAmount,
      outstandingAmount,
      paymentRate,
      paymentStatus,
      chargeStartDate: record.chargeStartDate ? new Date(record.chargeStartDate).toISOString() : null,
      chargeEndDate: record.chargeEndDate ? new Date(record.chargeEndDate).toISOString() : null,
      dueDate: record.dueDate ? new Date(record.dueDate).toISOString() : null,
      lastPaidAt: record.paidAt ? new Date(record.paidAt).toISOString() : null,
    };
  }

  private buildSummary(records: ManagementFeeHouseRecord[]) {
    const receivableAmount = records.reduce((sum, item) => sum + item.receivableAmount, 0);
    const paidAmount = records.reduce((sum, item) => sum + item.paidAmount, 0);
    const outstandingAmount = records.reduce((sum, item) => sum + item.outstandingAmount, 0);
    const paidHouseholds = records.filter((item) => item.paymentStatus === 'PAID').length;
    const partialHouseholds = records.filter((item) => item.paymentStatus === 'PARTIAL').length;
    const overdueHouseholds = records.filter((item) => item.paymentStatus === 'OVERDUE').length;

    return {
      chargeStartDate: records[0]?.chargeStartDate ?? null,
      chargeEndDate: records[0]?.chargeEndDate ?? null,
      dueDate: records[0]?.dueDate ?? null,
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

  private getCalculationRule() {
    return {
      version: 'manual-import-v1',
      baseAmount: BASE_AMOUNT,
      defaultArea: DEFAULT_AREA,
      description: '缴费状态来自楼栋公示人工导入，金额仍按面积分档单价加固定基础服务费计算。',
      tiers: [
        { minArea: 0, maxArea: 79.99, unitPrice: 2.38 },
        { minArea: 80, maxArea: 99.99, unitPrice: 2.68 },
        { minArea: 100, maxArea: 139.99, unitPrice: 2.96 },
        { minArea: 140, maxArea: null, unitPrice: 3.18 },
      ],
    };
  }

  private getUnitPrice(grossArea: number) {
    if (grossArea < 80) return 2.38;
    if (grossArea < 100) return 2.68;
    if (grossArea < 140) return 2.96;
    return 3.18;
  }

  private async resolvePeriodMonth(input?: string) {
    const value = input?.trim();
    if (value && /^\d{4}-\d{2}$/.test(value)) {
      return value;
    }

    const latest = await this.prisma.managementFeeRecord.findFirst({
      orderBy: [{ periodMonth: 'desc' }, { createdAt: 'desc' }],
      select: {
        periodMonth: true,
      },
    });

    if (latest?.periodMonth) {
      return latest.periodMonth;
    }

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }

  private round(value: number) {
    return Math.round(value * 100) / 100;
  }
}
