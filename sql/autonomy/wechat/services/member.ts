import { request } from './request';

export interface CurrentHouseMemberItem {
  id: string;
  userId: string;
  name: string;
  phone: string;
  role: string;
  status: string;
  statusLabel: string;
  joinDate: string;
  isPrimaryRole: boolean;
  canRemove: boolean;
}

export interface CurrentHouseMembersResult {
  houseId: string | null;
  houseDisplayName: string;
  buildingName: string | null;
  canManageMembers: boolean;
  total: number;
  items: CurrentHouseMemberItem[];
}

export function fetchCurrentHouseMembers() {
  return request<CurrentHouseMembersResult>({
    url: '/members/current-house',
    method: 'GET',
  });
}

export function removeCurrentHouseMember(id: string) {
  return request<{ id: string; removed: boolean }>({
    url: `/members/current-house/${id}`,
    method: 'DELETE',
  });
}
