import { request } from '@/api/request';
import type { AdminOperationLogListQuery, PaginatedOperationLogList } from './types';

export function fetchOperationLogList(params: AdminOperationLogListQuery) {
  return request<PaginatedOperationLogList>({
    url: '/operation-logs',
    method: 'get',
    params,
  });
}
