import { request } from '@/api/request';
import type {
  CreateManagementFeePeriodPayload,
  ManagementFeeBuildingOption,
  ManagementFeeBuildingStatResponse,
  ManagementFeeHouseListResponse,
  ManagementFeeHouseQuery,
  ManagementFeeHouseRecord,
  ManagementFeePeriodItem,
  ManagementFeeSummary,
  UpdateManagementFeeStatusPayload,
} from './types';

export function fetchManagementFeePeriods() {
  return request<ManagementFeePeriodItem[]>({
    url: '/management-fees/periods',
    method: 'get',
  });
}

export function createManagementFeePeriod(payload: CreateManagementFeePeriodPayload) {
  return request<ManagementFeePeriodItem>({
    url: '/management-fees/periods',
    method: 'post',
    data: payload,
  });
}

export function fetchManagementFeeSummary(params?: { periodKey?: string; periodMonth?: string }) {
  return request<ManagementFeeSummary>({
    url: '/management-fees/summary',
    method: 'get',
    params,
  });
}

export function fetchManagementFeeBuildings(params?: { periodKey?: string; periodMonth?: string }) {
  return request<ManagementFeeBuildingStatResponse>({
    url: '/management-fees/buildings',
    method: 'get',
    params,
  });
}

export function fetchManagementFeeHouses(params: ManagementFeeHouseQuery) {
  return request<ManagementFeeHouseListResponse>({
    url: '/management-fees/houses',
    method: 'get',
    params,
  });
}

export function fetchManagementFeeBuildingOptions(params?: { periodKey?: string; periodMonth?: string }) {
  return request<ManagementFeeBuildingOption[]>({
    url: '/management-fees/options/buildings',
    method: 'get',
    params,
  });
}

export function updateManagementFeeStatus(id: string, payload: UpdateManagementFeeStatusPayload) {
  return request<ManagementFeeHouseRecord>({
    url: `/management-fees/houses/${id}/status`,
    method: 'patch',
    data: payload,
  });
}
