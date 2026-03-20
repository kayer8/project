<template>
  <PageContainer title="投票结果">
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
          <div class="admin-panel__title">结果台账</div>
          <div class="admin-panel__desc">投票结果页更强调结果追溯、参与覆盖率和结论沉淀。</div>
        </div>
      </div>
      <div class="admin-panel__body">
        <t-table :data="voteResultRecords" :columns="columns" row-key="id" size="small" bordered hover>
          <template #titleCell="{ row }">
            <div class="table-primary-cell">
              <div class="table-primary-cell__title">{{ row.title }}</div>
              <div class="table-subtext">{{ row.type }} / 结束于 {{ row.endedAt }}</div>
            </div>
          </template>

          <template #result="{ row }">
            <t-tag :theme="resultThemeMap[row.result]" variant="light-outline">{{ row.result }}</t-tag>
          </template>

          <template #coverage="{ row }">
            {{ row.votedHouseholds }} / {{ row.totalHouseholds }}
          </template>

          <template #actions="{ row }">
            <div class="action-link-group">
              <t-button variant="text" theme="primary" @click="notifyAction('查看结果详情', row.title)">
                查看
              </t-button>
              <t-button variant="text" @click="notifyAction('导出结果', row.title)">导出</t-button>
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
import { voteResultRecords } from '@/mock/governance';

const resultThemeMap = {
  通过: 'success',
  未通过: 'danger',
  统计中: 'warning',
} as const;

const columns = [
  { colKey: 'titleCell', title: '投票标题', minWidth: 280, ellipsis: true },
  { colKey: 'coverage', title: '覆盖户数', width: 120 },
  { colKey: 'passRate', title: '通过率', width: 100 },
  { colKey: 'result', title: '结果', width: 100 },
  { colKey: 'endedAt', title: '结束时间', width: 160 },
  { colKey: 'actions', title: '操作', width: 160, fixed: 'right' },
];

const summaryCards = [
  { title: '已归档结果', value: voteResultRecords.length, description: '已形成结果台账的投票事项总量' },
  { title: '通过事项', value: 1, description: '已经达到规则门槛并通过的正式事项' },
  { title: '未通过事项', value: 1, description: '已结束但未达成通过门槛的事项' },
  { title: '平均覆盖率', value: '80.2%', description: '已归档投票结果的平均覆盖户数比例' },
];

function notifyAction(action: string, title: string) {
  MessagePlugin.info(`${action}：${title}`);
}
</script>
