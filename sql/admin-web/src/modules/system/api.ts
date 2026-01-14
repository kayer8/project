import { request } from '@/api/request';

export function fetchSystemLogs() {
  return request<string[]>({
    url: '/system/logs',
    method: 'GET',
  });
}