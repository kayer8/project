import { request } from '@/api/request';
import type {
  AdminOwnerListQuery,
  AdminOwnerReviewListQuery,
  OwnerReviewListItem,
  PaginatedOwnerList,
  PaginatedOwnerReviewList,
  ReviewOwnerRequestPayload,
} from './types';

export function fetchOwnerList(params: AdminOwnerListQuery) {
  return request<PaginatedOwnerList>({
    url: '/owners',
    method: 'get',
    params,
  });
}

export function fetchOwnerReviewList(params: AdminOwnerReviewListQuery) {
  return request<PaginatedOwnerReviewList>({
    url: '/owners/reviews',
    method: 'get',
    params,
  });
}

export function reviewOwnerRequest(id: string, payload: ReviewOwnerRequestPayload) {
  return request<OwnerReviewListItem>({
    url: `/owners/reviews/${id}`,
    method: 'patch',
    data: payload,
  });
}
