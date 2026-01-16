<template>
  <PageContainer title="看板总览">
    <div class="overview-toolbar">
      <t-date-range-picker v-model="range" value-type="YYYY-MM-DD" />
      <t-space>
        <t-button variant="outline" @click="goTaskFunnel">任务漏斗</t-button>
        <t-button variant="outline" @click="goNightFunnel">夜间漏斗</t-button>
        <t-button variant="outline" @click="goTaskRanking">模板表现排行</t-button>
      </t-space>
    </div>

    <div class="overview-section">
      <div class="section-title">今日</div>
      <div class="metric-grid">
        <MetricCard label="日活" :value="summary?.today.dau || 0" clickable @click="goTaskFunnel" />
        <MetricCard label="新增用户" :value="summary?.today.newUsers || 0" />
        <MetricCard label="次日留存" :value="formatRate(summary?.today.retention1d)" />
        <MetricCard
          label="任务完成率"
          :value="formatRate(summary?.today.taskCompletionRate)"
          clickable
          @click="goTaskFunnel"
        />
        <MetricCard
          label="夜间完成率"
          :value="formatRate(summary?.today.nightCompletionRate)"
          clickable
          @click="goNightFunnel"
        />
        <MetricCard label="换一换使用率" :value="formatRate(summary?.today.refreshRate)" />
      </div>
    </div>

    <div class="overview-section">
      <div class="section-title">昨日</div>
      <div class="metric-grid">
        <MetricCard label="日活" :value="summary?.yesterday.dau || 0" />
        <MetricCard label="新增用户" :value="summary?.yesterday.newUsers || 0" />
        <MetricCard label="次日留存" :value="formatRate(summary?.yesterday.retention1d)" />
        <MetricCard label="任务完成率" :value="formatRate(summary?.yesterday.taskCompletionRate)" />
        <MetricCard label="夜间完成率" :value="formatRate(summary?.yesterday.nightCompletionRate)" />
        <MetricCard label="换一换使用率" :value="formatRate(summary?.yesterday.refreshRate)" />
      </div>
    </div>

    <div class="overview-section">
      <div class="section-title">近7天均值</div>
      <div class="metric-grid">
        <MetricCard label="日活" :value="summary?.range7d.dau || 0" />
        <MetricCard label="新增用户" :value="summary?.range7d.newUsers || 0" />
        <MetricCard label="次日留存" :value="formatRate(summary?.range7d.retention1d)" />
        <MetricCard label="任务完成率" :value="formatRate(summary?.range7d.taskCompletionRate)" />
        <MetricCard label="夜间完成率" :value="formatRate(summary?.range7d.nightCompletionRate)" />
        <MetricCard label="换一换使用率" :value="formatRate(summary?.range7d.refreshRate)" />
      </div>
    </div>

    <t-card title="7日趋势">
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
  { colKey: 'date', title: '日期', width: 120 },
  { colKey: 'dau', title: '日活', width: 120 },
  {
    colKey: 'taskCompletionRate',
    title: '任务完成率',
    width: 160,
    cell: ({ row }: { row: TrendPoint }) => formatRate(row.taskCompletionRate),
  },
  {
    colKey: 'nightCompletionRate',
    title: '夜间完成率',
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
