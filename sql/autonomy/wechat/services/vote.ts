import { request } from './request';

export type VoteType = 'FORMAL' | 'CONSULTATION';
export type VoteStatus = 'DRAFT' | 'ONGOING' | 'ENDED';
export type VoteResult = 'PENDING' | 'PASSED' | 'REJECTED';

export interface VoteOptionItem {
  id: string;
  optionText: string;
  sortNo: number;
  voteCount: number;
  percent: number;
}

export interface VoteItem {
  id: string;
  title: string;
  type: VoteType;
  sponsor: string;
  scope: string;
  description: string | null;
  totalHouseholds: number;
  participantCount: number;
  participationRate: number;
  passRate: number;
  result: VoteResult;
  status: VoteStatus;
  deadline: string | null;
  publishedAt: string | null;
  endedAt: string | null;
  createdAt: string;
  updatedAt: string;
  voted: boolean;
  selectedOptionId: string | null;
  canVote: boolean;
  options: VoteOptionItem[];
}

export interface VoteListResult {
  items: VoteItem[];
  total: number;
  page: number;
  pageSize: number;
}

export interface VoteListQuery {
  page?: number;
  pageSize?: number;
  type?: VoteType;
  status?: VoteStatus;
}

export interface CreateVotePayload {
  title: string;
  type: VoteType;
  deadline?: string;
  description?: string;
  options: Array<{
    optionText: string;
  }>;
}

export function fetchVotes(query: VoteListQuery) {
  const search = buildSearch(query);

  return request<VoteListResult>({
    url: `/votes${search}`,
    method: 'GET',
    auth: false,
  });
}

export function fetchVoteDetail(id: string) {
  return request<VoteItem>({
    url: `/votes/${id}`,
    method: 'GET',
    auth: false,
  });
}

export function createVote(payload: CreateVotePayload) {
  return request<VoteItem>({
    url: '/votes',
    method: 'POST',
    data: payload,
  });
}

export function submitVote(id: string, optionId: string) {
  return request<VoteItem>({
    url: `/votes/${id}/ballots`,
    method: 'POST',
    data: { optionId },
  });
}

export function formatVoteType(type: VoteType) {
  return type === 'FORMAL' ? '正式表决' : '意见征集';
}

export function formatVoteStatus(status: VoteStatus) {
  if (status === 'ONGOING') {
    return '进行中';
  }

  if (status === 'ENDED') {
    return '已结束';
  }

  return '草稿';
}

export function formatVoteDeadline(value?: string | null) {
  if (!value) {
    return '未设置';
  }

  return value.slice(0, 16).replace('T', ' ');
}

function buildSearch(query: VoteListQuery) {
  const pairs = Object.entries(query).filter(([, value]) => value !== undefined && value !== null && value !== '');

  if (!pairs.length) {
    return '';
  }

  return `?${pairs
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join('&')}`;
}
