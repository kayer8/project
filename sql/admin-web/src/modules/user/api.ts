import { mockUserList } from '@/mocks/data';
import type { UserItem } from './types';

export function fetchUserList() {
  return Promise.resolve<UserItem[]>(mockUserList);
}
