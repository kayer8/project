<template>
  <PageContainer title="Task Funnel">
    <template #actions>
      <t-space>
        <t-button variant="outline" @click="handleExport">Export</t-button>
        <t-button variant="outline" @click="goToRanking">View Template Ranking</t-button>
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
  { colKey: 'stage', title: 'Stage', minWidth: 220 },
  { colKey: 'users', title: 'Users', width: 140 },
  {
    colKey: 'rate',
    title: 'Conversion',
    width: 140,
    cell: ({ row }: { row: FunnelStage }) => `${Math.round(row.rate * 100)}%`,
  },
];

const handleExport = () => {
  MessagePlugin.success('Exported funnel (mock).');
};

const goToRanking = () => {
  router.push({ path: '/task-templates', query: { sort: 'completion_desc' } });
};

onMounted(async () => {
  stages.value = await fetchTaskFunnel();
});
</script>
