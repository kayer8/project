export type UserAccountStatus = 'ACTIVE' | 'DISABLED' | 'DELETED';
export type CommunityRoleType = 'COMMITTEE_MEMBER' | 'BUILDING_LEADER' | 'VOLUNTEER';
export type CommunityRoleStatus = 'ACTIVE' | 'INACTIVE' | 'EXPIRED';
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
export type IdentityApplicationType =
  | 'OWNER_VERIFY'
  | 'TENANT_VERIFY'
  | 'COMMITTEE_VERIFY';
export type ReviewStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'WITHDRAWN'
  | 'SUPPLEMENT_REQUIRED';

export interface CommunityRoleRecord {
  communityId?: string;
  communityName: string;
  roleType: CommunityRoleType;
  roleLabel?: string;
  status: CommunityRoleStatus;
  effectiveAt: string;
  expiredAt?: string | null;
}

export interface HouseRelationRecord {
  id: string;
  houseId?: string;
  houseDisplayName: string;
  buildingName: string;
  householdGroupId?: string;
  householdType: string;
  relationType: MemberRelationType;
  relationLabel?: string;
  isPrimaryRole: boolean;
  canViewBill: boolean;
  canPayBill: boolean;
  canActAsAgent: boolean;
  canJoinConsultation: boolean;
  canBeVoteDelegate: boolean;
  status: MemberRelationStatus;
  effectiveAt: string;
  expiredAt?: string | null;
}

export interface IdentityApplicationRecord {
  id: string;
  applicationType: IdentityApplicationType;
  status: ReviewStatus;
  houseId?: string | null;
  houseDisplayName?: string | null;
  submittedAt: string;
  reviewedAt?: string | null;
  rejectReason?: string | null;
}

export interface UserListItem {
  id: string;
  realName: string;
  nickname: string;
  mobile: string | null;
  status: UserAccountStatus;
  registerSource: string;
  communityNames: string[];
  houseCount: number;
  primaryRoleLabel: string;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface UserDetail extends UserListItem {
  wechatOpenid: string;
  wechatUnionid: string | null;
  mobileVerifiedAt: string | null;
  deletedAt: string | null;
  communityRoles: CommunityRoleRecord[];
  houseRelations: HouseRelationRecord[];
  identityApplications: IdentityApplicationRecord[];
}

export interface PaginatedUserList {
  items: UserListItem[];
  total: number;
  page: number;
  pageSize: number;
}

export interface AdminUserListQuery {
  page?: number;
  pageSize?: number;
  keyword?: string;
  status?: string;
  communityId?: string;
}

export interface CreateAdminUserPayload {
  wechatOpenid: string;
  wechatUnionid?: string;
  nickname?: string;
  realName?: string;
  mobile?: string;
  avatarUrl?: string;
  status?: UserAccountStatus;
}

export type UpdateAdminUserPayload = Partial<CreateAdminUserPayload>;

export const userStatusLabelMap: Record<UserAccountStatus, string> = {
  ACTIVE: '正常',
  DISABLED: '停用',
  DELETED: '已删除',
};

export const communityRoleLabelMap: Record<CommunityRoleType, string> = {
  COMMITTEE_MEMBER: '委员会成员',
  BUILDING_LEADER: '楼栋负责人',
  VOLUNTEER: '志愿者',
};

export const communityRoleStatusLabelMap: Record<CommunityRoleStatus, string> = {
  ACTIVE: '有效',
  INACTIVE: '无效',
  EXPIRED: '已过期',
};

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

export const identityApplicationLabelMap: Record<IdentityApplicationType, string> = {
  OWNER_VERIFY: '业主认证',
  TENANT_VERIFY: '租户认证',
  COMMITTEE_VERIFY: '委员会认证',
};

export const reviewStatusLabelMap: Record<ReviewStatus, string> = {
  PENDING: '待审核',
  APPROVED: '已通过',
  REJECTED: '已驳回',
  WITHDRAWN: '已撤回',
  SUPPLEMENT_REQUIRED: '待补充资料',
};

export const userStatusOptions = [
  { label: '全部状态', value: 'ALL' },
  { label: userStatusLabelMap.ACTIVE, value: 'ACTIVE' },
  { label: userStatusLabelMap.DISABLED, value: 'DISABLED' },
  { label: userStatusLabelMap.DELETED, value: 'DELETED' },
];
