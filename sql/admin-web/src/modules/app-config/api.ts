import { mockAppConfig, mockConfigLogs } from '@/mocks/admin';
import type { AppConfig, ConfigChangeLog } from './types';

export function fetchAppConfig() {
  return Promise.resolve<AppConfig>(mockAppConfig);
}

export function fetchConfigLogs() {
  return Promise.resolve<ConfigChangeLog[]>(mockConfigLogs);
}
