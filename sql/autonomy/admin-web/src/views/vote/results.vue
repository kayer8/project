<template>
  <PageContainer title="投票结果">
    <template #actions>
      <div class="page-header__search-actions">
        <t-input
          v-model="quickKeyword"
          class="page-header__search-input"
          clearable
          placeholder="快速搜索投票标题、发起方、范围或说明"
        />
        <t-button variant="outline" @click="filterVisible = !filterVisible">
          {{ filterVisible ? '收起筛选' : '筛选' }}
        </t-button>
      </div>
    </template>

    <section class="admin-panel">
      <div class="admin-panel__header">
        <div>
          <div class="admin-panel__title">结果台账</div>
        </div>
      </div>
      <div class="admin-panel__body">
        <div v-if="filterVisible" class="inline-filter-panel">
          <div class="inline-filter-panel__header">
            <div class="inline-filter-panel__title">筛选条件</div>
          </div>
          <div class="filter-grid vote-result-filter-grid">
            <t-select v-model="filters.type" :options="voteTypeOptions" />
            <t-select v-model="filters.result" :options="voteResultOptions" />
            <div class="toolbar-actions">
              <t-button theme="primary" @click="handleSearch">查询</t-button>
              <t-button variant="outline" @click="resetFilters">重置</t-button>
            </div>
          </div>
        </div>

        <div class="table-toolbar">
          <div class="table-toolbar__meta">
            <span>共 {{ pagination.total }} 条结果</span>
          </div>
        </div>

        <t-table :data="records" :columns="columns" row-key="id" size="small" table-layout="fixed" bordered hover>
          <template #titleCell="{ row }">
            <div class="table-primary-cell">
              <div class="table-primary-cell__title">{{ row.title }}</div>
              <div class="table-subtext">{{ voteTypeLabelMap[row.type] }} / 结束于 {{ formatDateTime(row.endedAt) }}</div>
              <div class="table-subtext">选项：{{ formatOptionPreview(row.options) }}</div>
            </div>
          </template>

          <template #coverage="{ row }">
            {{ row.participantCount }} / {{ row.totalHouseholds }}
          </template>

          <template #passRate="{ row }">
            {{ formatPercent(row.passRate) }}
          </template>

          <template #result="{ row }">
            <t-tag :theme="voteResultThemeMap[row.result]" variant="light-outline">
              {{ voteResultLabelMap[row.result] }}
            </t-tag>
          </template>

          <template #endedAt="{ row }">
            {{ formatDateTime(row.endedAt) }}
          </template>
        </t-table>

        <div class="table-pagination">
          <t-pagination
            :current="pagination.page"
            :page-size="pagination.pageSize"
            :total="pagination.total"
            show-jumper
            show-page-size
            @change="handlePageChange"
          />
        </div>
      </div>
    </section>
  </PageContainer>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import PageContainer from '@/components/PageContainer/index.vue';
import { useQuickKeywordSearch } from '@/composables/useQuickKeywordSearch';
import { fetchVoteList } from '@/modules/vote/api';
import type { VoteItem } from '@/modules/vote/types';
import {
  voteResultLabelMap,
  voteResultOptions,
  voteResultThemeMap,
  voteTypeLabelMap,
  voteTypeOptions,
} from '@/modules/vote/types';
import { formatDateTime } from '@/utils/format';

const records = ref<VoteItem[]>([]);
const filterVisible = ref(false);
const filters = reactive({
  keyword: '',
  type: 'ALL',
  result: 'ALL',
});
const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0,
});

const columns = [
  { colKey: 'titleCell', title: '投票标题', minWidth: 320, ellipsis: true },
  { colKey: 'coverage', title: '覆盖户数', width: 120 },
  { colKey: 'passRate', title: '通过率', width: 100 },
  { colKey: 'result', title: '结果', width: 110 },
  { colKey: 'endedAt', title: '结束时间', width: 180 },
];

const { quickKeyword, setQuickKeyword, commitQuickKeyword, clearQuickKeywordTimer } = useQuickKeywordSearch(
  (keyword) => {
    filters.keyword = keyword;
    pagination.page = 1;
    void loadList();
  },
);

function formatPercent(value: number) {
  return `${Number(value ?? 0).toFixed(1)}%`;
}

function formatOptionPreview(options: VoteItem['options']) {
  if (!options?.length) {
    return '-';
  }

  return options.map((item) => item.optionText).join(' / ');
}

async function loadList() {
  const result = await fetchVoteList({
    page: pagination.page,
    pageSize: pagination.pageSize,
    keyword: filters.keyword.trim() || undefined,
    type: filters.type === 'ALL' ? undefined : (filters.type as VoteItem['type']),
    status: 'ENDED',
    result: filters.result === 'ALL' ? undefined : (filters.result as VoteItem['result']),
  });

  records.value = result.items;
  pagination.total = result.total;
}

function handleSearch() {
  commitQuickKeyword();
}

function resetFilters() {
  clearQuickKeywordTimer();
  setQuickKeyword('');
  filters.keyword = '';
  filters.type = 'ALL';
  filters.result = 'ALL';
  pagination.page = 1;
  void loadList();
}

function handlePageChange(pageInfo: { current: number; pageSize: number }) {
  pagination.page = pageInfo.current;
  pagination.pageSize = pageInfo.pageSize;
  void loadList();
}

onMounted(() => {
  void loadList();
});
</script>

<style scoped>
.vote-result-filter-grid {
  grid-template-columns: minmax(180px, 240px) minmax(180px, 240px) auto;
}

@media (max-width: 1280px) {
  .vote-result-filter-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .vote-result-filter-grid {
    grid-template-columns: 1fr;
  }
}
</style>
