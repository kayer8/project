export interface DashboardSummaryBlock {
  dau: number;
  newUsers: number;
  retention1d: number;
  taskCompletionRate: number;
  nightCompletionRate: number;
  refreshRate: number;
}

export interface DashboardSummary {
  today: DashboardSummaryBlock;
  yesterday: DashboardSummaryBlock;
  range7d: DashboardSummaryBlock;
}

export interface TrendPoint {
  date: string;
  dau: number;
  taskCompletionRate: number;
  nightCompletionRate: number;
}

export interface FunnelStage {
  stage: string;
  users: number;
  rate: number;
}

export interface TaskRankingItem {
  id: string;
  title: string;
  completionRate: number;
  skipRate: number;
  replaceRate: number;
}
