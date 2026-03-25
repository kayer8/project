import { request } from './request';

export type ManagementFeePaymentStatus = 'PAID' | 'PARTIAL' | 'PENDING' | 'OVERDUE';

export interface ManagementFeeDisclosureHouseItem {
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
  paymentStatus: ManagementFeePaymentStatus;
  paymentStatusLabel: string;
  lastPaidAt: string | null;
}

export interface ManagementFeeDisclosureBuildingItem {
  buildingId: string;
  buildingName: string;
  houseCount: number;
  receivableAmount: number;
  paidAmount: number;
  outstandingAmount: number;
  paidHouseholds: number;
  partialHouseholds: number;
  overdueHouseholds: number;
  unpaidHouseholds: number;
  paymentRate: number;
  houses: ManagementFeeDisclosureHouseItem[];
}

export interface ManagementFeeDisclosurePeriodSummary {
  chargeStartDate: string | null;
  chargeEndDate: string | null;
  dueDate: string | null;
  houseCount: number;
  receivableAmount: number;
  paidAmount: number;
  outstandingAmount: number;
  paymentRate: number;
  paidHouseholds: number;
  partialHouseholds: number;
  overdueHouseholds: number;
  unpaidHouseholds: number;
}

export interface ManagementFeeDisclosurePeriodItem {
  periodKey: string;
  periodMonth: string | null;
  title: string;
  rangeLabel: string;
  chargeStartDate: string | null;
  chargeEndDate: string | null;
  dueDate: string | null;
  buildingCount: number;
  summary: ManagementFeeDisclosurePeriodSummary;
  buildings: ManagementFeeDisclosureBuildingItem[];
}

export interface ManagementFeeDisclosureTreeResult {
  title: string;
  publisher: string;
  note: string;
  summary: {
    periodCount: number;
    houseCount: number;
    receivableAmount: number;
    paidAmount: number;
    outstandingAmount: number;
    paidHouseholds: number;
    partialHouseholds: number;
    overdueHouseholds: number;
    unpaidHouseholds: number;
    paymentRate: number;
  };
  buildingOptions: Array<{
    buildingId: string;
    buildingName: string;
  }>;
  periods: ManagementFeeDisclosurePeriodItem[];
  updatedAt: string;
}

export interface ManagementFeeDisclosureQuery {
  periodKey?: string;
  periodMonth?: string;
  buildingId?: string;
  keyword?: string;
  paymentStatus?: ManagementFeePaymentStatus;
}

export function fetchManagementFeeDisclosureTree(query: ManagementFeeDisclosureQuery = {}) {
  const search = buildSearch(query);

  return request<ManagementFeeDisclosureTreeResult>({
    url: `/management-fees/disclosure-tree${search}`,
    method: 'GET',
    auth: false,
  });
}

export function formatManagementFeeDate(value?: string | null) {
  if (!value) {
    return '';
  }

  return value.slice(0, 10);
}

export function formatManagementFeeDateTime(value?: string | null) {
  if (!value) {
    return '';
  }

  return value.slice(0, 16).replace('T', ' ');
}

function buildSearch(query: ManagementFeeDisclosureQuery) {
  const pairs = Object.entries(query).filter(([, value]) => value !== undefined && value !== null && value !== '');

  if (!pairs.length) {
    return '';
  }

  return `?${pairs.map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`).join('&')}`;
}
