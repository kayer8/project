export type OwnerAuthStatus = 'VERIFIED' | 'SUPPLEMENT_REQUIRED' | 'INVALID';
export type VoteQualification = 'QUALIFIED' | 'NEEDS_AUTHORIZATION' | 'UNQUALIFIED';

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

export interface AdminOwnerListQuery {
  page?: number;
  pageSize?: number;
  keyword?: string;
  buildingId?: string;
  authStatus?: OwnerAuthStatus;
  voteQualification?: VoteQualification;
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
