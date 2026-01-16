<template>
  <PageContainer title="夜间漏斗">
    <template #actions>
      <t-space>
        <t-button variant="outline" @click="handleExport">导出</t-button>
        <t-button variant="outline" @click="goToPrograms">查看低完成率</t-button>
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
import { fetchNightFunnel } from '@/modules/analytics/api';
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

const goToPrograms = () => {
  router.push({ path: '/night-programs', query: { sort: 'completion_desc' } });
};

onMounted(async () => {
  stages.value = await fetchNightFunnel();
});
</script>

