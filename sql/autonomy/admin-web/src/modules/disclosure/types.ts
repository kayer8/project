export type DisclosureContentStatus = 'DRAFT' | 'PUBLISHED';
export type DisclosureContentCategory = '通知公告' | '财务公开' | '管理公开' | '投票公示' | '收费公开';

export interface DisclosureContentItem {
  id: string;
  title: string;
  category: DisclosureContentCategory | string;
  publisher: string;
  summary: string | null;
  content: string;
  status: DisclosureContentStatus;
  publishStartAt: string | null;
  publishEndAt: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedDisclosureContentList {
  items: DisclosureContentItem[];
  total: number;
  page: number;
  pageSize: number;
}

export interface AdminDisclosureContentListQuery {
  page?: number;
  pageSize?: number;
  keyword?: string;
  category?: DisclosureContentCategory;
  status?: DisclosureContentStatus;
}

export interface CreateAdminDisclosureContentPayload {
  title: string;
  category: DisclosureContentCategory;
  publisher: string;
  summary?: string;
  content: string;
  publishStartAt?: string;
  publishEndAt?: string;
}

export type UpdateAdminDisclosureContentPayload = Partial<CreateAdminDisclosureContentPayload>;

export const disclosureContentStatusLabelMap: Record<DisclosureContentStatus, string> = {
  DRAFT: '草稿',
  PUBLISHED: '已发布',
};

export const disclosureContentStatusThemeMap: Record<DisclosureContentStatus, 'warning' | 'success'> = {
  DRAFT: 'warning',
  PUBLISHED: 'success',
};

export const disclosureContentStatusOptions = [
  { label: '全部状态', value: 'ALL' },
  { label: disclosureContentStatusLabelMap.DRAFT, value: 'DRAFT' },
  { label: disclosureContentStatusLabelMap.PUBLISHED, value: 'PUBLISHED' },
];

export const disclosureContentCategoryOptions = [
  { label: '全部分类', value: 'ALL' },
  { label: '通知公告', value: '通知公告' },
  { label: '财务公开', value: '财务公开' },
  { label: '管理公开', value: '管理公开' },
  { label: '投票公示', value: '投票公示' },
  { label: '收费公开', value: '收费公开' },
];
