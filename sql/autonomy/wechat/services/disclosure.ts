import { request } from './request';

export type DisclosureCategory = '通知公告' | '财务公开' | '管理公开' | '投票公示' | '收费公开';

export interface PublicDisclosureContentItem {
  id: string;
  title: string;
  category: DisclosureCategory | string;
  publisher: string;
  summary: string | null;
  content: string;
  status: 'PUBLISHED' | 'DRAFT';
  publishStartAt: string | null;
  publishEndAt: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PublicDisclosureContentListResult {
  items: PublicDisclosureContentItem[];
  total: number;
  page: number;
  pageSize: number;
}

export interface PublicDisclosureContentListQuery {
  page?: number;
  pageSize?: number;
  keyword?: string;
  category?: DisclosureCategory;
}

export function fetchDisclosureContents(query: PublicDisclosureContentListQuery = {}) {
  const search = buildSearch(query);

  return request<PublicDisclosureContentListResult>({
    url: `/disclosure-contents${search}`,
    method: 'GET',
    auth: false,
  });
}

export function fetchDisclosureContentDetail(id: string) {
  return request<PublicDisclosureContentItem>({
    url: `/disclosure-contents/${id}`,
    method: 'GET',
    auth: false,
  });
}

export function formatDisclosureDate(value?: string | null) {
  if (!value) {
    return '';
  }

  return value.slice(0, 10);
}

export function getDisclosureDisplayDate(item: PublicDisclosureContentItem) {
  return item.publishedAt || item.publishStartAt || item.updatedAt || item.createdAt;
}

export function getDisclosurePreview(item: PublicDisclosureContentItem, maxLength = 72) {
  const source = (item.summary || item.content || '').replace(/\s+/g, ' ').trim();

  if (!source) {
    return '';
  }

  if (source.length <= maxLength) {
    return source;
  }

  return `${source.slice(0, maxLength)}...`;
}

function buildSearch(query: PublicDisclosureContentListQuery) {
  const pairs = Object.entries(query).filter(([, value]) => value !== undefined && value !== null && value !== '');

  if (!pairs.length) {
    return '';
  }

  const search = pairs
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join('&');

  return `?${search}`;
}
