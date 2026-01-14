import { request } from '@/api/request';
import type { ContentItem } from './types';

export function fetchContentList() {
  return request<ContentItem[]>({
    url: '/content',
    method: 'GET',
  });
}