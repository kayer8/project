import { mockContentList } from '@/mocks/data';
import type { ContentItem } from './types';

export function fetchContentList() {
  return Promise.resolve<ContentItem[]>(mockContentList);
}
