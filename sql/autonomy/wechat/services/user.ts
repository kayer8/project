import { request } from './request';

export interface CurrentUserDetail {
  id: string;
  realName: string;
  nickname: string;
  avatarUrl: string | null;
  mobile: string | null;
  status: string;
  registerSource: string;
  communityNames: string[];
  houseCount: number;
  primaryRoleLabel: string;
  lastLoginAt: string | null;
  createdAt: string;
  wechatOpenid: string;
  wechatUnionid: string | null;
  mobileVerifiedAt: string | null;
  deletedAt: string | null;
  communityRoles: Array<{
    communityId?: string;
    communityName: string;
    roleType: string;
    roleLabel?: string;
    status: string;
    effectiveAt: string;
    expiredAt?: string | null;
  }>;
  houseRelations: Array<{
    id: string;
    houseId?: string;
    houseDisplayName: string;
    buildingName: string;
    householdGroupId?: string;
    householdType: string;
    relationType: string;
    relationLabel?: string;
    isPrimaryRole: boolean;
    canViewBill: boolean;
    canPayBill: boolean;
    canActAsAgent: boolean;
    canJoinConsultation: boolean;
    canBeVoteDelegate: boolean;
    status: string;
    effectiveAt: string;
    expiredAt?: string | null;
  }>;
  identityApplications: Array<{
    id: string;
    applicationType: string;
    status: string;
    houseId?: string | null;
    houseDisplayName?: string | null;
    submittedAt: string;
    reviewedAt?: string | null;
    rejectReason?: string | null;
  }>;
}

export function fetchCurrentUser() {
  return request<CurrentUserDetail>({
    url: '/users/me',
    method: 'GET',
  });
}
