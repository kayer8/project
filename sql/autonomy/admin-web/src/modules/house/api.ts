import { request } from '@/api/request';
import type {
  AdminHouseListQuery,
  BuildingOption,
  CommunityOption,
  CreateHouseResidentArchivePayload,
  CreateAdminHousePayload,
  HouseDetail,
  HouseResidentArchiveItem,
  PaginatedHouseList,
  UpdateHouseResidentArchivePayload,
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

export function fetchHouseArchives(houseId: string) {
  return request<HouseResidentArchiveItem[]>({
    url: `/houses/${houseId}/archives`,
    method: 'get',
  });
}

export function createHouseArchive(houseId: string, payload: CreateHouseResidentArchivePayload) {
  return request<HouseResidentArchiveItem>({
    url: `/houses/${houseId}/archives`,
    method: 'post',
    data: payload,
  });
}

export function updateHouseArchive(
  houseId: string,
  archiveId: string,
  payload: UpdateHouseResidentArchivePayload,
) {
  return request<HouseResidentArchiveItem>({
    url: `/houses/${houseId}/archives/${archiveId}`,
    method: 'patch',
    data: payload,
  });
}

export function removeHouseArchive(houseId: string, archiveId: string) {
  return request<{ id: string; removed: boolean }>({
    url: `/houses/${houseId}/archives/${archiveId}`,
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
