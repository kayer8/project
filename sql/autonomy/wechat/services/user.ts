import { request } from './request';

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
