import { request } from '@/api/request';
import type { AdminOwnerListQuery, PaginatedOwnerList } from './types';

export function fetchOwnerList(params: AdminOwnerListQuery) {
  return request<PaginatedOwnerList>({
    url: '/owners',
    method: 'get',
    params,
  });
}
