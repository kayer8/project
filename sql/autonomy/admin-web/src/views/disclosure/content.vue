<template>
  <PageContainer title="内容管理">
    <template #actions>
      <t-button theme="primary">创建内容</t-button>
    </template>

    <section class="admin-panel">
      <div class="admin-panel__header">
        <div>
          <div class="admin-panel__title">内容台账</div>
        </div>
      </div>
      <div class="admin-panel__body">
        <t-table :data="disclosureRecords" :columns="columns" row-key="id" size="small" bordered hover>
          <template #titleCell="{ row }">
            <div class="table-primary-cell">
              <div class="table-primary-cell__title">{{ row.title }}</div>
              <div class="table-subtext">{{ row.owner }}</div>
            </div>
          </template>

          <template #status="{ row }">
            <t-tag :theme="statusThemeMap[row.status]" variant="light-outline">{{ row.status }}</t-tag>
          </template>

          <template #actions="{ row }">
            <div class="action-link-group">
              <t-button variant="text" @click="notifyAction('编辑', row.title)">编辑</t-button>
              <t-button variant="text" theme="primary" @click="notifyAction('发布', row.title)">发布</t-button>
            </div>
          </template>
        </t-table>
      </div>
    </section>
  </PageContainer>
</template>

<script setup lang="ts">
import { MessagePlugin } from 'tdesign-vue-next';
import PageContainer from '@/components/PageContainer/index.vue';
import { disclosureRecords } from '@/mock/governance';

const statusThemeMap = {
  已发布: 'success',
  草稿: 'warning',
  待审核: 'primary',
} as const;

const columns = [
  { colKey: 'titleCell', title: '内容标题', minWidth: 280, ellipsis: true },
  { colKey: 'category', title: '分类', width: 120 },
  { colKey: 'status', title: '状态', width: 100 },
  { colKey: 'publishWindow', title: '发布窗口', width: 180 },
  { colKey: 'updatedAt', title: '更新时间', width: 160 },
  { colKey: 'actions', title: '操作', width: 160, fixed: 'right' },
];

function notifyAction(action: string, title: string) {
  MessagePlugin.info(`${action}：${title}`);
}
</script>
