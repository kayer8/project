export type TaskTemplateType = 'timer' | 'steps' | 'free';
export type TaskTemplateStatus = 'online' | 'offline';

export interface TaskTemplatePerformance {
  exposure: number;
  completed: number;
  skipped: number;
  completionRate: number;
  skipRate: number;
  replaceRate: number;
  skipReasons: string[];
  replaceReasons: string[];
  noteConversionRate?: number;
}

export interface TaskTemplateTags {
  moods: string[];
  directions: string[];
  traces: string[];
}

export interface TaskTemplate {
  id: string;
  title: string;
  description: string;
  type: TaskTemplateType;
  difficulty: 1 | 2 | 3;
  status: TaskTemplateStatus;
  tags: TaskTemplateTags;
  defaultDuration?: number;
  steps?: string[];
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
  performance: {
    range7d: TaskTemplatePerformance;
    range30d: TaskTemplatePerformance;
  };
}
