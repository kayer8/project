<template>
  <PageContainer title="模板表现排行">
    <template #actions>
      <t-space>
        <t-button variant="outline" @click="handleExport">导出</t-button>
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
            <t-link theme="default" @click.stop="handleOffline(row)">下线</t-link>
            <t-link theme="primary" @click.stop="goEdit(row)">编辑</t-link>
            <t-link theme="default" @click.stop="goDetail(row)">查看详情</t-link>
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
  { colKey: 'id', title: '模板ID', width: 120 },
  { colKey: 'title', title: '标题', minWidth: 220 },
  { colKey: 'completionRate', title: '完成率', width: 140 },
  { colKey: 'skipRate', title: '跳过率', width: 120 },
  { colKey: 'replaceRate', title: '换出率', width: 120 },
  { colKey: 'operation', title: '操作', width: 200, fixed: 'right' },
];

const formatRate = (value: number) => `${Math.round(value * 100)}%`;

const handleExport = () => {
  MessagePlugin.success('已导出排行（模拟）。');
};

const handleOffline = (row: TaskRankingItem) => {
  MessagePlugin.success(`模板 ${row.id} 已下线（模拟）。`);
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

