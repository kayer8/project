import { request } from '@/api/request';
import type {
  AdminMemberListQuery,
  CreateAdminMemberPayload,
  MemberDetail,
  PaginatedMemberList,
  UpdateAdminMemberPayload,
} from './types';

export function fetchMemberList(params: AdminMemberListQuery) {
  return request<PaginatedMemberList>({
    url: '/members',
    method: 'get',
    params,
  });
}

export function fetchMemberDetail(id: string) {
  return request<MemberDetail>({
    url: `/members/${id}`,
    method: 'get',
  });
}

export function createMember(payload: CreateAdminMemberPayload) {
  return request<MemberDetail>({
    url: '/members',
    method: 'post',
    data: payload,
  });
}

export function updateMember(id: string, payload: UpdateAdminMemberPayload) {
  return request<MemberDetail>({
    url: `/members/${id}`,
    method: 'patch',
    data: payload,
  });
}

export function removeMember(id: string) {
  return request<{ id: string; removed: boolean }>({
    url: `/members/${id}`,
    method: 'delete',
  });
}
