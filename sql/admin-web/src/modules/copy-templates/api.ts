import { mockCopyTemplates } from '@/mocks/admin';
import type { CopyTemplate } from './types';

export function fetchCopyTemplates() {
  return Promise.resolve<CopyTemplate[]>(mockCopyTemplates);
}

export function fetchCopyTemplateById(id: string) {
  return Promise.resolve<CopyTemplate | undefined>(
    mockCopyTemplates.find((item) => item.id === id),
  );
}
