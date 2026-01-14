import type { ContentItem } from '@/modules/content/types';
import type { SystemLog } from '@/modules/system/types';
import type { UserItem } from '@/modules/user/types';

export const mockContentList: ContentItem[] = [
  { id: 1, title: 'Launch plan draft', author: 'Alice' },
  { id: 2, title: 'Pricing update', author: 'Ben' },
  { id: 3, title: 'Quarterly report', author: 'Catherine' },
];

export const mockUserList: UserItem[] = [
  { id: 1, name: 'Alice', role: 'Admin' },
  { id: 2, name: 'Ben', role: 'Editor' },
  { id: 3, name: 'Catherine', role: 'Viewer' },
];

export const mockSystemLogs: SystemLog[] = [
  { id: 1, message: 'Alice updated pricing content.' },
  { id: 2, message: 'Ben reviewed the launch plan.' },
  { id: 3, message: 'System backup completed.' },
];
