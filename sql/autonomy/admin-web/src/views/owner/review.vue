<template>
  <PageContainer title="认证审核">
    <section class="stats-strip">
      <article v-for="item in summaryCards" :key="item.title" class="stat-card">
        <div class="stat-card__label">{{ item.title }}</div>
        <div class="stat-card__value">{{ item.value }}</div>
        <div class="stat-card__meta">{{ item.description }}</div>
      </article>
    </section>

    <section class="admin-panel">
      <div class="admin-panel__header">
        <div>
          <div class="admin-panel__title">审核列表</div>
          <div class="admin-panel__desc">操作列直接提供通过与拒绝入口，适合后台快速处理审核积压。</div>
        </div>
      </div>
      <div class="admin-panel__body">
        <t-table :data="ownerReviewRecords" :columns="columns" row-key="id" size="small" bordered hover>
          <template #nameCell="{ row }">
            <div class="table-primary-cell">
              <div class="table-primary-cell__title">{{ row.name }}</div>
              <div class="table-subtext">{{ row.mobile }} / {{ row.role }}</div>
            </div>
          </template>

          <template #status="{ row }">
            <t-tag :theme="statusThemeMap[row.status]" variant="light-outline">{{ row.status }}</t-tag>
          </template>

          <template #actions="{ row }">
            <div class="action-link-group">
              <t-button variant="text" theme="primary" @click="notifyAction('通过', row.name)">通过</t-button>
              <t-button variant="text" theme="danger" @click="notifyAction('拒绝', row.name)">拒绝</t-button>
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
import { ownerReviewRecords } from '@/mock/governance';

const statusThemeMap = {
  待审核: 'warning',
  已通过: 'success',
  已拒绝: 'danger',
} as const;

const columns = [
  { colKey: 'nameCell', title: '申请人', minWidth: 220 },
  { colKey: 'house', title: '房号', width: 160 },
  { colKey: 'status', title: '状态', width: 100 },
  { colKey: 'submittedAt', title: '提交时间', width: 160 },
  { colKey: 'actions', title: '操作', width: 160, fixed: 'right' },
];

const summaryCards = [
  { title: '待审核', value: 1, description: '需要管理员尽快处理的认证申请数量' },
  { title: '已通过', value: 1, description: '已完成审核并生效的认证申请数量' },
  { title: '已拒绝', value: 1, description: '已明确拒绝并完成回执的认证申请数量' },
  { title: '今日新增', value: 1, description: '今天新提交的认证申请数量' },
];

function notifyAction(action: string, name: string) {
  MessagePlugin.info(`${action}：${name}`);
}
</script>
