import { request } from './request';

export interface CurrentHouseProfile {
  isVerified: boolean;
  verificationStatus: 'VERIFIED' | 'UNVERIFIED';
  communityName: string | null;
  houseId: string | null;
  houseDisplayName: string | null;
  buildingId: string | null;
  buildingName: string | null;
  relationType: string | null;
  relationStatus: string | null;
  isPrimaryRole: boolean;
  memberCount: number;
  canViewBill: boolean;
  canPayBill: boolean;
  canJoinConsultation: boolean;
  canBeVoteDelegate: boolean;
}

export interface CurrentUserDetail {
  id: string;
  realName: string | null;
  nickname: string | null;
  avatarUrl: string | null;
  mobile: string | null;
  status: string;
  registerSource: string;
  residentStatus: 'SYNCED' | 'UNVERIFIED' | 'REJECTED' | 'REGISTERED';
  latestRegistrationRequest: {
    id: string;
    mobile: string;
    status: string;
    buildingId: string;
    buildingName: string | null;
    houseId: string | null;
    houseDisplayName: string | null;
    reviewNote: string | null;
    submittedAt: string;
  } | null;
  currentHouseProfile: CurrentHouseProfile;
  houseRelations: Array<{
    id: string;
    houseId: string;
    houseDisplayName: string;
    buildingName: string;
    relationLabel: string;
    status: string;
    isPrimaryRole: boolean;
  }>;
}

export function fetchCurrentUser() {
  return request<CurrentUserDetail>({
    url: '/users/me',
    method: 'GET',
  });
}
