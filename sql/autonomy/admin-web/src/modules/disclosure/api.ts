import { request } from '@/api/request';
import type {
  AdminDisclosureContentListQuery,
  CreateAdminDisclosureContentPayload,
  DisclosureContentItem,
  PaginatedDisclosureContentList,
  UpdateAdminDisclosureContentPayload,
} from './types';

export function fetchDisclosureContentList(params: AdminDisclosureContentListQuery) {
  return request<PaginatedDisclosureContentList>({
    url: '/disclosure-contents',
    method: 'get',
    params,
  });
}

export function fetchDisclosureContentDetail(id: string) {
  return request<DisclosureContentItem>({
    url: `/disclosure-contents/${id}`,
    method: 'get',
  });
}

export function createDisclosureContent(payload: CreateAdminDisclosureContentPayload) {
  return request<DisclosureContentItem>({
    url: '/disclosure-contents',
    method: 'post',
    data: payload,
  });
}

export function updateDisclosureContent(id: string, payload: UpdateAdminDisclosureContentPayload) {
  return request<DisclosureContentItem>({
    url: `/disclosure-contents/${id}`,
    method: 'patch',
    data: payload,
  });
}

export function publishDisclosureContent(id: string) {
  return request<DisclosureContentItem>({
    url: `/disclosure-contents/${id}/publish`,
    method: 'patch',
  });
}

export function removeDisclosureContent(id: string) {
  return request<{ id: string; removed: boolean }>({
    url: `/disclosure-contents/${id}`,
    method: 'delete',
  });
}
