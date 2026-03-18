import { request } from '@/api/request';
import type {
  AdminHouseListQuery,
  BuildingOption,
  CommunityOption,
  CreateAdminHousePayload,
  HouseDetail,
  PaginatedHouseList,
  UpdateAdminHousePayload,
} from './types';

export function fetchHouseList(params: AdminHouseListQuery) {
  return request<PaginatedHouseList>({
    url: '/houses',
    method: 'get',
    params,
  });
}

export function fetchHouseDetail(id: string) {
  return request<HouseDetail>({
    url: `/houses/${id}`,
    method: 'get',
  });
}

export function createHouse(payload: CreateAdminHousePayload) {
  return request<HouseDetail>({
    url: '/houses',
    method: 'post',
    data: payload,
  });
}

export function updateHouse(id: string, payload: UpdateAdminHousePayload) {
  return request<HouseDetail>({
    url: `/houses/${id}`,
    method: 'patch',
    data: payload,
  });
}

export function removeHouse(id: string) {
  return request<{ id: string; removed: boolean }>({
    url: `/houses/${id}`,
    method: 'delete',
  });
}

export function fetchCommunityOptions() {
  return request<CommunityOption[]>({
    url: '/houses/options/communities',
    method: 'get',
  });
}

export function fetchBuildingOptions() {
  return request<BuildingOption[]>({
    url: '/buildings/options',
    method: 'get',
  });
}
