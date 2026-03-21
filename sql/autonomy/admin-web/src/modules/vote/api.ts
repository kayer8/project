import { request } from '@/api/request';
import type {
  AdminVoteListQuery,
  CreateAdminVotePayload,
  PaginatedVoteList,
  UpdateAdminVotePayload,
  VoteItem,
  VoteScopeSummary,
} from './types';

export function fetchVoteList(params: AdminVoteListQuery) {
  return request<PaginatedVoteList>({
    url: '/votes',
    method: 'get',
    params,
  });
}

export function fetchVoteDetail(id: string) {
  return request<VoteItem>({
    url: `/votes/${id}`,
    method: 'get',
  });
}

export function fetchVoteScopeSummary(params: {
  type: string;
  scopeType?: string;
  scopeBuildingId?: string;
  scopeBuildingIds?: string;
}) {
  return request<VoteScopeSummary>({
    url: '/votes/scope-summary',
    method: 'get',
    params,
  });
}

export function createVote(payload: CreateAdminVotePayload) {
  return request<VoteItem>({
    url: '/votes',
    method: 'post',
    data: payload,
  });
}

export function updateVote(id: string, payload: UpdateAdminVotePayload) {
  return request<VoteItem>({
    url: `/votes/${id}`,
    method: 'patch',
    data: payload,
  });
}

export function publishVote(id: string) {
  return request<VoteItem>({
    url: `/votes/${id}/publish`,
    method: 'patch',
  });
}

export function endVote(id: string) {
  return request<VoteItem>({
    url: `/votes/${id}/end`,
    method: 'patch',
  });
}

export function removeVote(id: string) {
  return request<{ id: string; removed: boolean }>({
    url: `/votes/${id}`,
    method: 'delete',
  });
}
