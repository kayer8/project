<template>
  <PageContainer title="公告列表">
    <template #actions>
      <div class="page-header__search-actions">
        <t-input v-model="quickKeyword" class="page-header__search-input" clearable placeholder="快速搜索公告标题 / 发布单位" />
        <t-button variant="outline" @click="filterVisible = !filterVisible">
          {{ filterVisible ? '收起筛选' : '筛选' }}
        </t-button>
        <t-button theme="primary">新建公告</t-button>
      </div>
    </template>

    <section class="admin-panel">
      <div class="admin-panel__header">
        <div>
          <div class="admin-panel__title">公告台账</div>
        </div>
      </div>
      <div class="admin-panel__body">
        <div v-if="filterVisible" class="inline-filter-panel">
          <div class="inline-filter-panel__header">
            <div class="inline-filter-panel__title">筛选查询</div>
          </div>
          <div class="filter-grid">
            <t-select v-model="filters.category" :options="categoryOptions" />
            <t-select v-model="filters.status" :options="statusOptions" />
            <div class="toolbar-actions">
              <t-button theme="primary" @click="handleSearch">查询</t-button>
              <t-button variant="outline" @click="resetFilters">重置</t-button>
            </div>
          </div>
        </div>

        <t-table :data="filteredRows" :columns="columns" row-key="id" size="small" bordered hover>
          <template #titleCell="{ row }">
            <div class="table-primary-cell">
              <div class="table-primary-cell__title">{{ row.title }}</div>
              <div class="table-subtext">
                {{ row.priority }}{{ row.isPinned ? ' / 已置顶' : '' }}
              </div>
            </div>
          </template>

          <template #status="{ row }">
            <t-tag :theme="statusThemeMap[row.status]" variant="light-outline">{{ row.status }}</t-tag>
          </template>

          <template #actions="{ row }">
            <div class="action-link-group">
              <t-button variant="text" @click="notifyAction('编辑', row.title)">编辑</t-button>
              <t-button variant="text" theme="danger" @click="notifyAction('删除', row.title)">删除</t-button>
              <t-button variant="text" theme="primary" @click="notifyAction('置顶', row.title)">置顶</t-button>
            </div>
          </template>
        </t-table>
      </div>
    </section>
  </PageContainer>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { MessagePlugin } from 'tdesign-vue-next';
import PageContainer from '@/components/PageContainer/index.vue';
import { useQuickKeywordSearch } from '@/composables/useQuickKeywordSearch';
import { announcementRecords } from '@/mock/governance';

const filters = reactive({
  keyword: '',
  category: 'ALL',
  status: 'ALL',
});
const filterVisible = ref(false);
const { quickKeyword, setQuickKeyword, commitQuickKeyword, clearQuickKeywordTimer } = useQuickKeywordSearch(
  (keyword) => {
    filters.keyword = keyword;
  },
);

const categoryOptions = [
  { label: '全部分类', value: 'ALL' },
  { label: '社区公告', value: '社区公告' },
  { label: '通知公告', value: '通知公告' },
  { label: '办事指南', value: '办事指南' },
];

const statusOptions = [
  { label: '全部状态', value: 'ALL' },
  { label: '已发布', value: '已发布' },
  { label: '草稿', value: '草稿' },
  { label: '待发布', value: '待发布' },
];

const statusThemeMap = {
  已发布: 'success',
  草稿: 'warning',
  待发布: 'primary',
} as const;

const columns = [
  { colKey: 'titleCell', title: '公告标题', minWidth: 280, ellipsis: true },
  { colKey: 'category', title: '分类', width: 120 },
  { colKey: 'issuer', title: '发布单位', width: 140 },
  { colKey: 'publishAt', title: '发布时间', width: 160 },
  { colKey: 'status', title: '状态', width: 100 },
  { colKey: 'actions', title: '操作', width: 180, fixed: 'right' },
];

const filteredRows = computed(() =>
  announcementRecords.filter((item) => {
    const keyword = filters.keyword.trim();
    const matchKeyword =
      !keyword || item.title.includes(keyword) || item.issuer.includes(keyword);
    const matchCategory = filters.category === 'ALL' || item.category === filters.category;
    const matchStatus = filters.status === 'ALL' || item.status === filters.status;
    return matchKeyword && matchCategory && matchStatus;
  }),
);

function resetFilters() {
  clearQuickKeywordTimer();
  setQuickKeyword('');
  filters.keyword = '';
  filters.category = 'ALL';
  filters.status = 'ALL';
}

function handleSearch() {
  commitQuickKeyword();
}

function notifyAction(action: string, title: string) {
  MessagePlugin.info(`${action}：${title}`);
}
</script>
