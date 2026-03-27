export type OwnerAuthStatus = 'VERIFIED' | 'SUPPLEMENT_REQUIRED' | 'INVALID';
export type VoteQualification = 'QUALIFIED' | 'NEEDS_AUTHORIZATION' | 'UNQUALIFIED';
export type OwnerReviewStatus = 'PENDING' | 'REVIEWED' | 'REJECTED' | 'CANCELLED';

export interface OwnerListItem {
  id: string;
  userId: string;
  name: string;
  mobile: string;
  houseId: string;
  house: string;
  buildingId: string;
  buildingName: string;
  identity: string;
  authStatus: OwnerAuthStatus;
  authStatusLabel: string;
  voteQualification: VoteQualification;
  voteQualificationLabel: string;
  updatedAt: string;
}

export interface PaginatedOwnerList {
  items: OwnerListItem[];
  total: number;
  page: number;
  pageSize: number;
}

export interface OwnerReviewListItem {
  id: string;
  userId: string;
  name: string;
  mobile: string;
  buildingId: string;
  buildingName: string;
  houseId: string | null;
  house: string;
  roleLabel: string;
  status: OwnerReviewStatus;
  statusLabel: string;
  reviewNote: string | null;
  submittedAt: string;
  updatedAt: string;
}

export interface PaginatedOwnerReviewList {
  items: OwnerReviewListItem[];
  total: number;
  page: number;
  pageSize: number;
}

export interface AdminOwnerListQuery {
  page?: number;
  pageSize?: number;
  keyword?: string;
  buildingId?: string;
  authStatus?: OwnerAuthStatus;
  voteQualification?: VoteQualification;
}

export interface AdminOwnerReviewListQuery {
  page?: number;
  pageSize?: number;
  keyword?: string;
  buildingId?: string;
  status?: OwnerReviewStatus;
}

export interface ReviewOwnerRequestPayload {
  status: Extract<OwnerReviewStatus, 'REVIEWED' | 'REJECTED'>;
  reviewNote?: string;
}

export const ownerAuthStatusOptions = [
  { label: '全部认证状态', value: 'ALL' },
  { label: '已认证', value: 'VERIFIED' },
  { label: '待补充材料', value: 'SUPPLEMENT_REQUIRED' },
  { label: '已失效', value: 'INVALID' },
];

export const voteQualificationOptions = [
  { label: '全部投票资格', value: 'ALL' },
  { label: '有资格', value: 'QUALIFIED' },
  { label: '需授权', value: 'NEEDS_AUTHORIZATION' },
  { label: '无资格', value: 'UNQUALIFIED' },
];

export const ownerReviewStatusOptions = [
  { label: '全部状态', value: 'ALL' },
  { label: '待审核', value: 'PENDING' },
  { label: '已通过', value: 'REVIEWED' },
  { label: '已拒绝', value: 'REJECTED' },
  { label: '已取消', value: 'CANCELLED' },
];
