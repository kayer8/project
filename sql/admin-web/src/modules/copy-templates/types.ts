export type CopyTemplateType =
  | 'task_complete'
  | 'night_closing'
  | 'empty_state'
  | 'error'
  | 'review';

export type CopyTemplateStatus = 'enabled' | 'disabled';

export interface CopyTemplateConditions {
  trace?: string;
  mood?: string;
  direction?: string;
}

export interface CopyTemplate {
  id: string;
  type: CopyTemplateType;
  content: string;
  conditions?: CopyTemplateConditions;
  weight?: number;
  status: CopyTemplateStatus;
  usage7d?: number;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
}
