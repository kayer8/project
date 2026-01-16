export type ConfigStatus = 'draft' | 'published';

export interface AppConfig {
  dailyTaskCount: number;
  cooldownDays: number;
  directionCoverageRequired: boolean;
  moodWeight: number;
  templateExposureLimit: number;
  refreshLimitPerDay: number;
  refreshScope: 'single' | 'any';
  skipProtection: boolean;
  nightSortStrategy: 'default' | 'completion' | 'audience';
  nightTraceTags: string[];
  version: number;
  status: ConfigStatus;
  updatedAt: string;
  updatedBy: string;
}

export interface ConfigChangeLog {
  version: number;
  updatedAt: string;
  updatedBy: string;
  diff: string;
}
