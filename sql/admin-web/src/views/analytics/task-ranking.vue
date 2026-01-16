<template>
  <PageContainer title="Task Template Ranking">
    <template #actions>
      <t-space>
        <t-button variant="outline" @click="handleExport">Export</t-button>
      </t-space>
    </template>

    <t-card>
      <t-table :data="ranking" :columns="columns" row-key="id">
        <template #completionRate="{ row }">
          {{ formatRate(row.completionRate) }}
        </template>
        <template #skipRate="{ row }">
          {{ formatRate(row.skipRate) }}
        </template>
        <template #replaceRate="{ row }">
          {{ formatRate(row.replaceRate) }}
        </template>
        <template #operation="{ row }">
          <t-space size="small">
            <t-link theme="default" @click.stop="handleOffline(row)">Offline</t-link>
            <t-link theme="primary" @click.stop="goEdit(row)">Edit</t-link>
            <t-link theme="default" @click.stop="goDetail(row)">Detail</t-link>
          </t-space>
        </template>
      </t-table>
    </t-card>
  </PageContainer>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { MessagePlugin } from 'tdesign-vue-next';
import PageContainer from '@/components/PageContainer/index.vue';
import { fetchTaskRanking } from '@/modules/analytics/api';
import type { TaskRankingItem } from '@/modules/analytics/types';

const router = useRouter();
const ranking = ref<TaskRankingItem[]>([]);

const columns = [
  { colKey: 'id', title: 'Template ID', width: 120 },
  { colKey: 'title', title: 'Title', minWidth: 220 },
  { colKey: 'completionRate', title: 'Completion', width: 140 },
  { colKey: 'skipRate', title: 'Skip', width: 120 },
  { colKey: 'replaceRate', title: 'Replace', width: 120 },
  { colKey: 'operation', title: 'Actions', width: 200, fixed: 'right' },
];

const formatRate = (value: number) => `${Math.round(value * 100)}%`;

const handleExport = () => {
  MessagePlugin.success('Exported ranking (mock).');
};

const handleOffline = (row: TaskRankingItem) => {
  MessagePlugin.success(`Template ${row.id} set offline (mock).`);
};

const goEdit = (row: TaskRankingItem) => {
  router.push(`/task-templates/${row.id}/edit`);
};

const goDetail = (row: TaskRankingItem) => {
  router.push(`/task-templates/${row.id}`);
};

onMounted(async () => {
  ranking.value = await fetchTaskRanking();
});
</script>
