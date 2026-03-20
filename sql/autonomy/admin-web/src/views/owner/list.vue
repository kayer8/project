<template>
  <PageContainer title="业主列表">
    <section class="admin-panel">
      <div class="admin-panel__header">
        <div>
          <div class="admin-panel__title">业主台账</div>
          <div class="admin-panel__desc">面向后续房屋认证、投票资格和成员关系管理的基础数据视图。</div>
        </div>
      </div>
      <div class="admin-panel__body">
        <t-table :data="ownerRecords" :columns="columns" row-key="id" size="small" bordered hover>
          <template #nameCell="{ row }">
            <div class="table-primary-cell">
              <div class="table-primary-cell__title">{{ row.name }}</div>
              <div class="table-subtext">{{ row.mobile }} / {{ row.identity }}</div>
            </div>
          </template>

          <template #authStatus="{ row }">
            <t-tag :theme="authThemeMap[row.authStatus]" variant="light-outline">{{ row.authStatus }}</t-tag>
          </template>

          <template #voteQualification="{ row }">
            <t-tag :theme="voteThemeMap[row.voteQualification]" variant="light-outline">
              {{ row.voteQualification }}
            </t-tag>
          </template>
        </t-table>
      </div>
    </section>
  </PageContainer>
</template>

<script setup lang="ts">
import PageContainer from '@/components/PageContainer/index.vue';
import { ownerRecords } from '@/mock/governance';

const authThemeMap = {
  已认证: 'success',
  待补充材料: 'warning',
  已失效: 'danger',
} as const;

const voteThemeMap = {
  有资格: 'success',
  需授权: 'warning',
  无资格: 'danger',
} as const;

const columns = [
  { colKey: 'nameCell', title: '住户信息', minWidth: 220 },
  { colKey: 'house', title: '房号', width: 160 },
  { colKey: 'authStatus', title: '认证状态', width: 120 },
  { colKey: 'voteQualification', title: '投票资格', width: 120 },
  { colKey: 'updatedAt', title: '最近更新', width: 160 },
];
</script>
