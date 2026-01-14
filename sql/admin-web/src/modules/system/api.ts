import { mockSystemLogs } from '@/mocks/data';
import type { SystemLog } from './types';

export function fetchSystemLogs() {
  return Promise.resolve<SystemLog[]>(mockSystemLogs);
}
