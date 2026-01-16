import { mockTaskTemplates } from '@/mocks/admin';
import type { TaskTemplate } from './types';

export function fetchTaskTemplates() {
  return Promise.resolve<TaskTemplate[]>(mockTaskTemplates);
}

export function fetchTaskTemplateById(id: string) {
  return Promise.resolve<TaskTemplate | undefined>(
    mockTaskTemplates.find((item) => item.id === id),
  );
}
