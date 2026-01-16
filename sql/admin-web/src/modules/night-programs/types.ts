export type NightProgramType = 'timer' | 'questions' | 'audio' | 'text';
export type NightProgramStatus = 'online' | 'offline';

export interface ProgramQuestion {
  id: string;
  text: string;
  options: string[];
  distribution?: Array<{ option: string; rate: number }>;
}

export interface NightProgramContent {
  text?: string;
  timerText?: string;
  audioUrl?: string;
  questions?: ProgramQuestion[];
}

export interface NightProgramPerformance {
  exposure: number;
  completionRate: number;
  exitRate: number;
  questionStats?: Record<string, Array<{ option: string; rate: number }>>;
  noteConversionRate?: number;
}

export interface NightProgramTags {
  moods: string[];
  directions: string[];
}

export interface NightProgram {
  id: string;
  title: string;
  type: NightProgramType;
  duration?: number;
  status: NightProgramStatus;
  tags: NightProgramTags;
  content: NightProgramContent;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
  performance: {
    range7d: NightProgramPerformance;
  };
}
