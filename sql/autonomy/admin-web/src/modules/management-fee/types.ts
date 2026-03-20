export type ManagementFeePaymentStatus = 'PAID' | 'PARTIAL' | 'PENDING' | 'OVERDUE';

export interface ManagementFeeSummary {
  periodMonth: string;
  chargeStartDate?: string | null;
  chargeEndDate?: string | null;
  dueDate?: string | null;
  calculationRule: {
    version: string;
    baseAmount: number;
    defaultArea: number;
    description: string;
    tiers: Array<{
      minArea: number;
      maxArea: number | null;
      unitPrice: number;
    }>;
  };
  houseCount: number;
  receivableAmount: number;
  paidAmount: number;
  outstandingAmount: number;
  paymentRate: number;
  paidHouseholds: number;
  partialHouseholds: number;
  overdueHouseholds: number;
  updatedAt: string;
}

export interface ManagementFeeBuildingStat {
  buildingId: string;
  buildingName: string;
  houseCount: number;
  receivableAmount: number;
  paidAmount: number;
  outstandingAmount: number;
  paidHouseCount: number;
  paymentRate: number;
  paidHouseRate: number;
}

export interface ManagementFeeBuildingStatResponse {
  periodMonth: string;
  chargeStartDate?: string | null;
  chargeEndDate?: string | null;
  dueDate?: string | null;
  items: ManagementFeeBuildingStat[];
  updatedAt: string;
}

export interface ManagementFeeHouseRecord {
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
  paymentStatus: ManagementFeePaymentStatus;
  paymentStatusLabel: string;
  chargeStartDate?: string | null;
  chargeEndDate?: string | null;
  dueDate?: string | null;
  lastPaidAt: string | null;
}

export interface ManagementFeeHouseListResponse {
  items: ManagementFeeHouseRecord[];
  total: number;
  page: number;
  pageSize: number;
  periodMonth: string;
}

export interface ManagementFeeHouseQuery {
  periodMonth?: string;
  keyword?: string;
  buildingId?: string;
  paymentStatus?: ManagementFeePaymentStatus;
  page?: number;
  pageSize?: number;
}

export interface ManagementFeeBuildingOption {
  id: string;
  buildingName: string;
  buildingCode: string;
  sortNo: number | null;
  status: 'ACTIVE' | 'DISABLED';
}

export const managementFeeStatusOptions = [
  { label: '全部状态', value: 'ALL' },
  { label: '已缴清', value: 'PAID' },
  { label: '部分缴纳', value: 'PARTIAL' },
  { label: '待缴纳', value: 'PENDING' },
  { label: '逾期未缴', value: 'OVERDUE' },
];
