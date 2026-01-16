import {
  mockDashboardSummary,
  mockTrendPoints,
  mockTaskFunnel,
  mockNightFunnel,
  mockTaskRanking,
} from '@/mocks/admin';
import type {
  DashboardSummary,
  TrendPoint,
  FunnelStage,
  TaskRankingItem,
} from './types';

export function fetchDashboardSummary() {
  return Promise.resolve<DashboardSummary>(mockDashboardSummary);
}

export function fetchTrendPoints() {
  return Promise.resolve<TrendPoint[]>(mockTrendPoints);
}

export function fetchTaskFunnel() {
  return Promise.resolve<FunnelStage[]>(mockTaskFunnel);
}

export function fetchNightFunnel() {
  return Promise.resolve<FunnelStage[]>(mockNightFunnel);
}

export function fetchTaskRanking() {
  return Promise.resolve<TaskRankingItem[]>(mockTaskRanking);
}
