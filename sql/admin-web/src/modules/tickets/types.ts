export type TicketType = 'bug' | 'suggestion' | 'other';
export type TicketStatus = 'new' | 'in_progress' | 'resolved' | 'closed';

export interface TicketUserSnapshot {
  id: string;
  version: string;
  device: string;
  os: string;
  activeDays: number;
  isNew: boolean;
}

export interface TicketTimelineItem {
  at: string;
  actor: string;
  action: string;
  note?: string;
}

export interface Ticket {
  id: string;
  type: TicketType;
  status: TicketStatus;
  summary: string;
  content: string;
  user: TicketUserSnapshot;
  createdAt: string;
  assignee?: string;
  tags: string[];
  timeline: TicketTimelineItem[];
  related?: {
    taskTemplateId?: string;
    nightProgramId?: string;
  };
}
