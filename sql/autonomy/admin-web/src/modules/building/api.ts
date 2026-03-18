import { request } from '@/api/request';
import type {
  AdminBuildingListQuery,
  BuildingDetail,
  BuildingOption,
  CreateAdminBuildingPayload,
  PaginatedBuildingList,
  UpdateAdminBuildingPayload,
} from './types';

export function fetchBuildingList(params: AdminBuildingListQuery) {
  return request<PaginatedBuildingList>({
    url: '/buildings',
    method: 'get',
    params,
  });
}

export function fetchBuildingDetail(id: string) {
  return request<BuildingDetail>({
    url: `/buildings/${id}`,
    method: 'get',
  });
}

export function createBuilding(payload: CreateAdminBuildingPayload) {
  return request<BuildingDetail>({
    url: '/buildings',
    method: 'post',
    data: payload,
  });
}

export function updateBuilding(id: string, payload: UpdateAdminBuildingPayload) {
  return request<BuildingDetail>({
    url: `/buildings/${id}`,
    method: 'patch',
    data: payload,
  });
}

export function removeBuilding(id: string) {
  return request<{ id: string; removed: boolean }>({
    url: `/buildings/${id}`,
    method: 'delete',
  });
}

export function fetchBuildingOptions() {
  return request<BuildingOption[]>({
    url: '/buildings/options',
    method: 'get',
  });
}
