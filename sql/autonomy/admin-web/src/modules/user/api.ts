import { request } from '@/api/request';
import type {
  AdminUserListQuery,
  CreateAdminUserPayload,
  PaginatedUserList,
  UpdateAdminUserPayload,
  UserDetail,
} from './types';

export function fetchUserList(params: AdminUserListQuery) {
  return request<PaginatedUserList>({
    url: '/users',
    method: 'get',
    params,
  });
}

export function fetchUserDetail(id: string) {
  return request<UserDetail>({
    url: `/users/${id}`,
    method: 'get',
  });
}

export function createUser(payload: CreateAdminUserPayload) {
  return request<UserDetail>({
    url: '/users',
    method: 'post',
    data: payload,
  });
}

export function updateUser(id: string, payload: UpdateAdminUserPayload) {
  return request<UserDetail>({
    url: `/users/${id}`,
    method: 'patch',
    data: payload,
  });
}

export function removeUser(id: string) {
  return request<{ id: string; removed: boolean }>({
    url: `/users/${id}`,
    method: 'delete',
  });
}
