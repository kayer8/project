export type HouseStatus = 'SELF_OCCUPIED' | 'RENTED' | 'VACANT' | 'OTHER';

export interface HouseListItem {
  id: string;
  buildingId: string;
  buildingName: string;
  unitNo: string;
  roomNo: string;
  displayName: string;
  houseStatus: HouseStatus;
  activeHouseholdType: string | null;
  memberCount: number;
  primaryRoleName: string | null;
  createdAt: string;
}

export interface HouseDetail extends HouseListItem {
  floorNo: number | null;
  grossArea: number | null;
  updatedAt: string;
  householdGroups: Array<{
    id: string;
    groupType: string;
    groupTypeLabel: string;
    status: string;
    startedAt: string;
    endedAt: string | null;
    memberCount: number;
  }>;
  members: Array<{
    id: string;
    userId: string;
    userName: string;
    mobile: string | null;
    relationType: string;
    relationLabel: string;
    householdGroupId: string;
    householdType: string | null;
    isPrimaryRole: boolean;
    canViewBill: boolean;
    canPayBill: boolean;
    canActAsAgent: boolean;
    canJoinConsultation: boolean;
    canBeVoteDelegate: boolean;
    status: string;
    effectiveAt: string;
    expiredAt: string | null;
  }>;
  activeVoteRepresentatives: Array<{
    id: string;
    scopeType: string;
    voteId: string | null;
    effectiveAt: string;
    expiredAt: string | null;
    representativeUserId: string;
    representativeUserName: string;
  }>;
}

export interface PaginatedHouseList {
  items: HouseListItem[];
  total: number;
  page: number;
  pageSize: number;
}

export interface AdminHouseListQuery {
  page?: number;
  pageSize?: number;
  keyword?: string;
  buildingId?: string;
  houseStatus?: string;
}

export interface CommunityOption {
  id: string;
  name: string;
  code: string;
}

export interface BuildingOption {
  id: string;
  buildingName: string;
  buildingCode: string;
  sortNo: number | null;
  status: 'ACTIVE' | 'DISABLED';
}

export interface CreateAdminHousePayload {
  buildingId: string;
  unitNo?: string;
  floorNo?: number | null;
  roomNo: string;
  displayName: string;
  houseStatus?: HouseStatus;
  grossArea?: number | null;
}

export type UpdateAdminHousePayload = Partial<CreateAdminHousePayload>;

export const houseStatusLabelMap: Record<HouseStatus, string> = {
  SELF_OCCUPIED: '自住',
  RENTED: '出租',
  VACANT: '空置',
  OTHER: '其他',
};

export const houseStatusOptions = [
  { label: '全部状态', value: 'ALL' },
  { label: houseStatusLabelMap.SELF_OCCUPIED, value: 'SELF_OCCUPIED' },
  { label: houseStatusLabelMap.RENTED, value: 'RENTED' },
  { label: houseStatusLabelMap.VACANT, value: 'VACANT' },
  { label: houseStatusLabelMap.OTHER, value: 'OTHER' },
];
