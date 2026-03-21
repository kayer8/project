export type VoteType = 'FORMAL' | 'CONSULTATION';
export type VoteStatus = 'DRAFT' | 'ONGOING' | 'ENDED';
export type VoteResult = 'PENDING' | 'PASSED' | 'REJECTED';
export type VoteScopeType = 'ALL' | 'BUILDING';
export type VoteScopeAudience = 'OWNER' | 'RESIDENT';

export interface VoteOptionItem {
  id?: string;
  optionText: string;
  sortNo: number;
}

export interface VoteItem {
  id: string;
  title: string;
  type: VoteType;
  sponsor: string;
  scope: string;
  scopeType: VoteScopeType;
  scopeAudience: VoteScopeAudience;
  scopeBuildingId: string | null;
  scopeBuildingName: string | null;
  scopeBuildingIds: string[];
  scopeBuildingNames: string[];
  options: VoteOptionItem[];
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
}

export interface PaginatedVoteList {
  items: VoteItem[];
  total: number;
  page: number;
  pageSize: number;
}

export interface AdminVoteListQuery {
  page?: number;
  pageSize?: number;
  keyword?: string;
  type?: VoteType;
  status?: VoteStatus;
  result?: VoteResult;
}

export interface CreateAdminVotePayload {
  title: string;
  type: VoteType;
  sponsor: string;
  scopeType?: VoteScopeType;
  scopeBuildingId?: string;
  scopeBuildingIds?: string[];
  options: Array<{ optionText: string }>;
  description?: string;
  deadline?: string;
  participantCount?: number;
  passRate?: number;
  result?: VoteResult;
}

export type UpdateAdminVotePayload = Partial<CreateAdminVotePayload>;

export interface VoteScopeSummary {
  scope: string;
  scopeType: VoteScopeType;
  scopeAudience: VoteScopeAudience;
  scopeBuildingId: string | null;
  scopeBuildingName: string | null;
  scopeBuildingIds: string[];
  scopeBuildingNames: string[];
  totalHouseholds: number;
  authenticatedUserCount: number;
}

export const voteTypeLabelMap: Record<VoteType, string> = {
  FORMAL: '正式表决',
  CONSULTATION: '意见征集',
};

export const voteStatusLabelMap: Record<VoteStatus, string> = {
  DRAFT: '草稿',
  ONGOING: '进行中',
  ENDED: '已结束',
};

export const voteResultLabelMap: Record<VoteResult, string> = {
  PENDING: '统计中',
  PASSED: '通过',
  REJECTED: '未通过',
};

export const voteStatusThemeMap: Record<VoteStatus, 'warning' | 'primary' | 'success'> = {
  DRAFT: 'warning',
  ONGOING: 'primary',
  ENDED: 'success',
};

export const voteResultThemeMap: Record<VoteResult, 'warning' | 'success' | 'danger'> = {
  PENDING: 'warning',
  PASSED: 'success',
  REJECTED: 'danger',
};

export const voteTypeOptions = [
  { label: '全部类型', value: 'ALL' },
  { label: voteTypeLabelMap.FORMAL, value: 'FORMAL' },
  { label: voteTypeLabelMap.CONSULTATION, value: 'CONSULTATION' },
];

export const voteScopeTypeLabelMap: Record<VoteScopeType, string> = {
  ALL: '全体范围',
  BUILDING: '指定楼栋',
};

export const voteStatusOptions = [
  { label: '全部状态', value: 'ALL' },
  { label: voteStatusLabelMap.DRAFT, value: 'DRAFT' },
  { label: voteStatusLabelMap.ONGOING, value: 'ONGOING' },
  { label: voteStatusLabelMap.ENDED, value: 'ENDED' },
];

export const voteResultOptions = [
  { label: '全部结果', value: 'ALL' },
  { label: voteResultLabelMap.PENDING, value: 'PENDING' },
  { label: voteResultLabelMap.PASSED, value: 'PASSED' },
  { label: voteResultLabelMap.REJECTED, value: 'REJECTED' },
];
