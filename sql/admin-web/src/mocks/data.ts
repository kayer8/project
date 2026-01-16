import type { ContentItem } from '@/modules/content/types';
import type { SystemLog } from '@/modules/system/types';
import type { UserItem } from '@/modules/user/types';

export const mockContentList: ContentItem[] = [
  { id: 1, title: '上线方案草稿', author: '王敏' },
  { id: 2, title: '价格更新', author: '李强' },
  { id: 3, title: '季度报告', author: '陈洁' },
];

export const mockUserList: UserItem[] = [
  { id: 1, name: '王敏', role: '管理员' },
  { id: 2, name: '李强', role: '编辑' },
  { id: 3, name: '陈洁', role: '查看者' },
];

export const mockSystemLogs: SystemLog[] = [
  { id: 1, message: '王敏更新了价格内容。' },
  { id: 2, message: '李强审阅了上线方案。' },
  { id: 3, message: '系统备份完成。' },
];
