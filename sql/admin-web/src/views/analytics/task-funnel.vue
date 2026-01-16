<template>
  <PageContainer title="任务漏斗">
    <template #actions>
      <t-space>
        <t-button variant="outline" @click="handleExport">导出</t-button>
        <t-button variant="outline" @click="goToRanking">查看模板排行</t-button>
      </t-space>
    </template>

    <t-card>
      <t-table :data="stages" :columns="columns" row-key="stage" />
    </t-card>
  </PageContainer>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { MessagePlugin } from 'tdesign-vue-next';
import PageContainer from '@/components/PageContainer/index.vue';
import { fetchTaskFunnel } from '@/modules/analytics/api';
import type { FunnelStage } from '@/modules/analytics/types';

const router = useRouter();
const stages = ref<FunnelStage[]>([]);

const columns = [
  { colKey: 'stage', title: '阶段', minWidth: 220 },
  { colKey: 'users', title: '人数', width: 140 },
  {
    colKey: 'rate',
    title: '转化率',
    width: 140,
    cell: ({ row }: { row: FunnelStage }) => `${Math.round(row.rate * 100)}%`,
  },
];

const handleExport = () => {
  MessagePlugin.success('已导出漏斗（模拟）。');
};

const goToRanking = () => {
  router.push({ path: '/task-templates', query: { sort: 'completion_desc' } });
};

onMounted(async () => {
  stages.value = await fetchTaskFunnel();
});
</script>

