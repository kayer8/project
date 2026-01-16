<template>
  <PageContainer title="Analytics Overview">
    <div class="overview-toolbar">
      <t-date-range-picker v-model="range" value-type="YYYY-MM-DD" />
      <t-space>
        <t-button variant="outline" @click="goTaskFunnel">Task Funnel</t-button>
        <t-button variant="outline" @click="goNightFunnel">Night Funnel</t-button>
        <t-button variant="outline" @click="goTaskRanking">Task Ranking</t-button>
      </t-space>
    </div>

    <div class="overview-section">
      <div class="section-title">Today</div>
      <div class="metric-grid">
        <MetricCard label="DAU" :value="summary?.today.dau || 0" clickable @click="goTaskFunnel" />
        <MetricCard label="New Users" :value="summary?.today.newUsers || 0" />
        <MetricCard label="Day-1 Retention" :value="formatRate(summary?.today.retention1d)" />
        <MetricCard
          label="Task Completion"
          :value="formatRate(summary?.today.taskCompletionRate)"
          clickable
          @click="goTaskFunnel"
        />
        <MetricCard
          label="Night Completion"
          :value="formatRate(summary?.today.nightCompletionRate)"
          clickable
          @click="goNightFunnel"
        />
        <MetricCard label="Refresh Rate" :value="formatRate(summary?.today.refreshRate)" />
      </div>
    </div>

    <div class="overview-section">
      <div class="section-title">Yesterday</div>
      <div class="metric-grid">
        <MetricCard label="DAU" :value="summary?.yesterday.dau || 0" />
        <MetricCard label="New Users" :value="summary?.yesterday.newUsers || 0" />
        <MetricCard label="Day-1 Retention" :value="formatRate(summary?.yesterday.retention1d)" />
        <MetricCard label="Task Completion" :value="formatRate(summary?.yesterday.taskCompletionRate)" />
        <MetricCard label="Night Completion" :value="formatRate(summary?.yesterday.nightCompletionRate)" />
        <MetricCard label="Refresh Rate" :value="formatRate(summary?.yesterday.refreshRate)" />
      </div>
    </div>

    <div class="overview-section">
      <div class="section-title">Last 7 Days Avg</div>
      <div class="metric-grid">
        <MetricCard label="DAU" :value="summary?.range7d.dau || 0" />
        <MetricCard label="New Users" :value="summary?.range7d.newUsers || 0" />
        <MetricCard label="Day-1 Retention" :value="formatRate(summary?.range7d.retention1d)" />
        <MetricCard label="Task Completion" :value="formatRate(summary?.range7d.taskCompletionRate)" />
        <MetricCard label="Night Completion" :value="formatRate(summary?.range7d.nightCompletionRate)" />
        <MetricCard label="Refresh Rate" :value="formatRate(summary?.range7d.refreshRate)" />
      </div>
    </div>

    <t-card title="Daily Trend (7d)">
      <t-table :data="trendPoints" :columns="trendColumns" row-key="date" />
    </t-card>
  </PageContainer>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import PageContainer from '@/components/PageContainer/index.vue';
import MetricCard from '@/components/MetricCard/index.vue';
import { fetchDashboardSummary, fetchTrendPoints } from '@/modules/analytics/api';
import type { DashboardSummary, TrendPoint } from '@/modules/analytics/types';

const router = useRouter();

const summary = ref<DashboardSummary>();
const trendPoints = ref<TrendPoint[]>([]);
const range = ref<string[]>([]);

const trendColumns = [
  { colKey: 'date', title: 'Date', width: 120 },
  { colKey: 'dau', title: 'DAU', width: 120 },
  {
    colKey: 'taskCompletionRate',
    title: 'Task Completion',
    width: 160,
    cell: ({ row }: { row: TrendPoint }) => formatRate(row.taskCompletionRate),
  },
  {
    colKey: 'nightCompletionRate',
    title: 'Night Completion',
    width: 160,
    cell: ({ row }: { row: TrendPoint }) => formatRate(row.nightCompletionRate),
  },
];

const formatRate = (value?: number) => `${Math.round((value || 0) * 100)}%`;

const goTaskFunnel = () => {
  router.push('/analytics/task-funnel');
};

const goNightFunnel = () => {
  router.push('/analytics/night-funnel');
};

const goTaskRanking = () => {
  router.push('/analytics/task-ranking');
};

onMounted(async () => {
  summary.value = await fetchDashboardSummary();
  trendPoints.value = await fetchTrendPoints();
});
</script>

<style scoped>
.overview-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.overview-section {
  margin-bottom: 20px;
}

.section-title {
  font-weight: 600;
  margin-bottom: 12px;
}

.metric-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 12px;
}
</style>
