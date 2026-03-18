export type BuildingStatus = 'ACTIVE' | 'DISABLED';

export interface BuildingListItem {
  id: string;
  buildingCode: string;
  buildingName: string;
  sortNo: number | null;
  status: BuildingStatus;
  houseCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface BuildingDetail extends BuildingListItem {
  houses: Array<{
    id: string;
    displayName: string;
    unitNo: string;
    roomNo: string;
    houseStatus: string;
  }>;
}

export interface PaginatedBuildingList {
  items: BuildingListItem[];
  total: number;
  page: number;
  pageSize: number;
}

export interface AdminBuildingListQuery {
  page?: number;
  pageSize?: number;
  keyword?: string;
  status?: string;
}

export interface BuildingOption {
  id: string;
  buildingName: string;
  buildingCode: string;
  sortNo: number | null;
  status: BuildingStatus;
}

export interface CreateAdminBuildingPayload {
  buildingCode: string;
  buildingName: string;
  sortNo?: number | null;
  status?: BuildingStatus;
}

export type UpdateAdminBuildingPayload = Partial<CreateAdminBuildingPayload>;

export const buildingStatusLabelMap: Record<BuildingStatus, string> = {
  ACTIVE: '启用',
  DISABLED: '停用',
};

export const buildingStatusOptions = [
  { label: '全部状态', value: 'ALL' },
  { label: buildingStatusLabelMap.ACTIVE, value: 'ACTIVE' },
  { label: buildingStatusLabelMap.DISABLED, value: 'DISABLED' },
];
