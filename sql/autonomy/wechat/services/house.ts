import { request } from './request';

export interface MyHouseSummary {
  relationId: string;
  houseId: string;
  displayName: string;
  buildingName: string;
  unitNo: string;
  roomNo: string;
  houseStatus: string;
  relationType: string;
  relationLabel: string;
  isPrimaryRole: boolean;
  status: string;
  memberCount: number;
  activeHouseholdType: string | null;
}

export function fetchMyHouses() {
  return request<MyHouseSummary[]>({
    url: '/houses/my',
    method: 'GET',
  });
}
