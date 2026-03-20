import { request } from '@/api/request';
import type {
  ManagementFeeBuildingOption,
  ManagementFeeBuildingStatResponse,
  ManagementFeeHouseListResponse,
  ManagementFeeHouseQuery,
  ManagementFeeSummary,
} from './types';

export function fetchManagementFeeSummary(periodMonth?: string) {
  return request<ManagementFeeSummary>({
    url: '/management-fees/summary',
    method: 'get',
    params: {
      periodMonth,
    },
  });
}

export function fetchManagementFeeBuildings(periodMonth?: string) {
  return request<ManagementFeeBuildingStatResponse>({
    url: '/management-fees/buildings',
    method: 'get',
    params: {
      periodMonth,
    },
  });
}

export function fetchManagementFeeHouses(params: ManagementFeeHouseQuery) {
  return request<ManagementFeeHouseListResponse>({
    url: '/management-fees/houses',
    method: 'get',
    params,
  });
}

export function fetchManagementFeeBuildingOptions() {
  return request<ManagementFeeBuildingOption[]>({
    url: '/management-fees/options/buildings',
    method: 'get',
  });
}
