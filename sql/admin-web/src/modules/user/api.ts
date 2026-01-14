import { request } from '@/api/request';
import type { UserItem } from './types';

export function fetchUserList() {
  return request<UserItem[]>({
    url: '/users',
    method: 'GET',
  });
}