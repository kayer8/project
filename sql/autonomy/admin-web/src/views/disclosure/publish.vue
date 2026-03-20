<template>
  <PageContainer title="发布记录">
    <section class="admin-panel">
      <div class="admin-panel__header">
        <div>
          <div class="admin-panel__title">发布留痕</div>
        </div>
      </div>
      <div class="admin-panel__body">
        <t-table :data="publishRecords" :columns="columns" row-key="id" size="small" bordered hover>
          <template #titleCell="{ row }">
            <div class="table-primary-cell">
              <div class="table-primary-cell__title">{{ row.title }}</div>
              <div class="table-subtext">{{ row.category }} / {{ row.channel }}</div>
            </div>
          </template>

          <template #result="{ row }">
            <t-tag :theme="resultThemeMap[row.result]" variant="light-outline">{{ row.result }}</t-tag>
          </template>
        </t-table>
      </div>
    </section>
  </PageContainer>
</template>

<script setup lang="ts">
import PageContainer from '@/components/PageContainer/index.vue';
import { publishRecords } from '@/mock/governance';

const resultThemeMap = {
  成功: 'success',
  失败: 'danger',
  待重试: 'warning',
} as const;

const columns = [
  { colKey: 'titleCell', title: '内容标题', minWidth: 280, ellipsis: true },
  { colKey: 'publisher', title: '发布人', width: 120 },
  { colKey: 'channel', title: '发布渠道', width: 140 },
  { colKey: 'result', title: '结果', width: 100 },
  { colKey: 'publishedAt', title: '发布时间', width: 160 },
];
</script>
