export type MemberRelationType =
  | 'MAIN_OWNER'
  | 'FAMILY_MEMBER'
  | 'MAIN_TENANT'
  | 'CO_RESIDENT'
  | 'AGENT';
export type MemberRelationStatus =
  | 'PENDING'
  | 'ACTIVE'
  | 'REJECTED'
  | 'INACTIVE'
  | 'EXPIRED'
  | 'REMOVED';

export interface MemberListItem {
  id: string;
  userId: string;
  userName: string;
  nickname: string | null;
  mobile: string | null;
  buildingName: string;
  houseId: string;
  houseDisplayName: string;
  householdGroupId: string;
  householdType: string;
  relationType: MemberRelationType;
  relationLabel: string;
  isPrimaryRole: boolean;
  status: MemberRelationStatus;
  effectiveAt: string;
  expiredAt: string | null;
}

export interface MemberDetail extends MemberListItem {
  canViewBill: boolean;
  canPayBill: boolean;
  canActAsAgent: boolean;
  canJoinConsultation: boolean;
  canBeVoteDelegate: boolean;
  userStatus: string;
  mobileVerifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedMemberList {
  items: MemberListItem[];
  total: number;
  page: number;
  pageSize: number;
}

export interface AdminMemberListQuery {
  page?: number;
  pageSize?: number;
  keyword?: string;
  status?: string;
  relationType?: string;
  houseId?: string;
}

export interface CreateAdminMemberPayload {
  userId: string;
  houseId: string;
  householdGroupId: string;
  relationType: MemberRelationType;
  relationLabel?: string;
  isPrimaryRole?: boolean;
  canViewBill?: boolean;
  canPayBill?: boolean;
  canActAsAgent?: boolean;
  canJoinConsultation?: boolean;
  canBeVoteDelegate?: boolean;
  status?: MemberRelationStatus;
  effectiveAt?: string | null;
  expiredAt?: string | null;
}

export type UpdateAdminMemberPayload = Partial<CreateAdminMemberPayload>;

export const memberRelationLabelMap: Record<MemberRelationType, string> = {
  MAIN_OWNER: '主业主',
  FAMILY_MEMBER: '家庭成员',
  MAIN_TENANT: '主租户',
  CO_RESIDENT: '同住成员',
  AGENT: '代办人',
};

export const memberRelationStatusLabelMap: Record<MemberRelationStatus, string> = {
  PENDING: '待审核',
  ACTIVE: '有效',
  REJECTED: '已驳回',
  INACTIVE: '无效',
  EXPIRED: '已过期',
  REMOVED: '已移除',
};

export const memberRelationOptions = [
  { label: memberRelationLabelMap.MAIN_OWNER, value: 'MAIN_OWNER' },
  { label: memberRelationLabelMap.FAMILY_MEMBER, value: 'FAMILY_MEMBER' },
  { label: memberRelationLabelMap.MAIN_TENANT, value: 'MAIN_TENANT' },
  { label: memberRelationLabelMap.CO_RESIDENT, value: 'CO_RESIDENT' },
  { label: memberRelationLabelMap.AGENT, value: 'AGENT' },
];

export const memberStatusOptions = [
  { label: '全部状态', value: 'ALL' },
  { label: memberRelationStatusLabelMap.PENDING, value: 'PENDING' },
  { label: memberRelationStatusLabelMap.ACTIVE, value: 'ACTIVE' },
  { label: memberRelationStatusLabelMap.REJECTED, value: 'REJECTED' },
  { label: memberRelationStatusLabelMap.INACTIVE, value: 'INACTIVE' },
  { label: memberRelationStatusLabelMap.EXPIRED, value: 'EXPIRED' },
  { label: memberRelationStatusLabelMap.REMOVED, value: 'REMOVED' },
];
