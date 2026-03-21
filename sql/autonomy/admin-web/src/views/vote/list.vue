<template>
  <PageContainer title="投票列表">
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
        <t-button theme="primary" @click="openCreate">新建投票</t-button>
      </div>
    </template>

    <section class="admin-panel">
      <div class="admin-panel__header">
        <div>
          <div class="admin-panel__title">投票列表</div>
        </div>
      </div>
      <div class="admin-panel__body">
        <div v-if="filterVisible" class="inline-filter-panel">
          <div class="inline-filter-panel__header">
            <div class="inline-filter-panel__title">筛选条件</div>
          </div>
          <div class="filter-grid vote-filter-grid">
            <t-select v-model="filters.type" :options="voteTypeOptions" />
            <t-select v-model="filters.status" :options="voteStatusOptions" />
            <div class="toolbar-actions">
              <t-button theme="primary" @click="handleSearch">查询</t-button>
              <t-button variant="outline" @click="resetFilters">重置</t-button>
            </div>
          </div>
        </div>

        <div class="table-toolbar">
          <div class="table-toolbar__meta">
            <span>共 {{ pagination.total }} 条投票</span>
          </div>
        </div>

        <t-table :data="records" :columns="columns" row-key="id" size="small" table-layout="fixed" bordered hover>
          <template #titleCell="{ row }">
            <div class="table-primary-cell">
              <div class="table-primary-cell__title">{{ row.title }}</div>
              <div class="table-subtext">{{ row.sponsor }} / {{ row.scope }}</div>
              <div class="table-subtext">选项：{{ formatOptionPreview(row.options) }}</div>
            </div>
          </template>

          <template #type="{ row }">
            {{ voteTypeLabelMap[row.type] }}
          </template>

          <template #status="{ row }">
            <t-tag :theme="voteStatusThemeMap[row.status]" variant="light-outline">
              {{ voteStatusLabelMap[row.status] }}
            </t-tag>
          </template>

          <template #participantCount="{ row }">
            {{ row.participantCount }}
          </template>

          <template #participationRate="{ row }">
            {{ formatPercent(row.participationRate) }}
          </template>

          <template #deadline="{ row }">
            {{ formatDateTime(row.deadline) }}
          </template>

          <template #publishedAt="{ row }">
            {{ formatDateTime(row.publishedAt) }}
          </template>

          <template #actions="{ row }">
            <div class="action-link-group">
              <t-button variant="text" @click="openEdit(row.id)">编辑</t-button>
              <t-button
                variant="text"
                theme="primary"
                :disabled="row.status !== 'DRAFT'"
                @click="handlePublish(row)"
              >
                发布
              </t-button>
              <t-button
                variant="text"
                theme="warning"
                :disabled="row.status !== 'ONGOING'"
                @click="handleEnd(row)"
              >
                结束
              </t-button>
              <t-button variant="text" theme="danger" @click="handleDelete(row.id, row.title)">删除</t-button>
            </div>
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

    <VoteFormDialog
      v-model:visible="dialogVisible"
      :mode="dialogMode"
      :initial-value="editingRecord"
      @success="handleDialogSuccess"
    />
  </PageContainer>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { DialogPlugin, MessagePlugin } from 'tdesign-vue-next';
import PageContainer from '@/components/PageContainer/index.vue';
import { useQuickKeywordSearch } from '@/composables/useQuickKeywordSearch';
import {
  endVote,
  fetchVoteDetail,
  fetchVoteList,
  publishVote,
  removeVote,
} from '@/modules/vote/api';
import type { VoteItem } from '@/modules/vote/types';
import {
  voteStatusLabelMap,
  voteStatusOptions,
  voteStatusThemeMap,
  voteTypeLabelMap,
  voteTypeOptions,
} from '@/modules/vote/types';
import { formatDateTime } from '@/utils/format';
import VoteFormDialog from './components/VoteFormDialog.vue';

const records = ref<VoteItem[]>([]);
const editingRecord = ref<VoteItem | null>(null);
const dialogVisible = ref(false);
const dialogMode = ref<'create' | 'edit'>('create');
const filterVisible = ref(false);
const filters = reactive({
  keyword: '',
  type: 'ALL',
  status: 'ALL',
});
const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0,
});

const columns = [
  { colKey: 'titleCell', title: '投票标题', minWidth: 320, ellipsis: true },
  { colKey: 'type', title: '类型', width: 120 },
  { colKey: 'status', title: '状态', width: 110 },
  { colKey: 'participantCount', title: '参与户数', width: 110 },
  { colKey: 'participationRate', title: '参与率', width: 100 },
  { colKey: 'deadline', title: '截止时间', width: 180 },
  { colKey: 'publishedAt', title: '发布时间', width: 180 },
  { colKey: 'actions', title: '操作', width: 220, fixed: 'right' },
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
    status: filters.status === 'ALL' ? undefined : (filters.status as VoteItem['status']),
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
  filters.status = 'ALL';
  pagination.page = 1;
  void loadList();
}

function handlePageChange(pageInfo: { current: number; pageSize: number }) {
  pagination.page = pageInfo.current;
  pagination.pageSize = pageInfo.pageSize;
  void loadList();
}

function openCreate() {
  dialogMode.value = 'create';
  editingRecord.value = null;
  dialogVisible.value = true;
}

async function openEdit(id: string) {
  dialogMode.value = 'edit';
  editingRecord.value = await fetchVoteDetail(id);
  dialogVisible.value = true;
}

function handleDelete(id: string, title: string) {
  const dialog = DialogPlugin.confirm({
    header: '确认删除投票',
    body: `将删除《${title}》，删除后不可恢复。`,
    confirmBtn: '确认删除',
    cancelBtn: '取消',
    onConfirm: async () => {
      await removeVote(id);
      if (records.value.length === 1 && pagination.page > 1) {
        pagination.page -= 1;
      }
      await loadList();
      MessagePlugin.success('投票删除成功');
      dialog.destroy();
    },
    onClose: () => dialog.destroy(),
  });
}

function handlePublish(row: VoteItem) {
  if (row.status !== 'DRAFT') {
    return;
  }

  const dialog = DialogPlugin.confirm({
    header: '确认发布投票',
    body: `将发布《${row.title}》，发布后投票状态会变为进行中。`,
    confirmBtn: '确认发布',
    cancelBtn: '取消',
    onConfirm: async () => {
      await publishVote(row.id);
      await loadList();
      MessagePlugin.success('投票发布成功');
      dialog.destroy();
    },
    onClose: () => dialog.destroy(),
  });
}

function handleEnd(row: VoteItem) {
  if (row.status !== 'ONGOING') {
    return;
  }

  const dialog = DialogPlugin.confirm({
    header: '确认结束投票',
    body: `将结束《${row.title}》，结束后会进入投票结果。`,
    confirmBtn: '确认结束',
    cancelBtn: '取消',
    onConfirm: async () => {
      await endVote(row.id);
      await loadList();
      MessagePlugin.success('投票已结束');
      dialog.destroy();
    },
    onClose: () => dialog.destroy(),
  });
}

async function handleDialogSuccess() {
  editingRecord.value = null;
  await loadList();
}

onMounted(() => {
  void loadList();
});
</script>

<style scoped>
.vote-filter-grid {
  grid-template-columns: minmax(180px, 240px) minmax(180px, 240px) auto;
}

@media (max-width: 1280px) {
  .vote-filter-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .vote-filter-grid {
    grid-template-columns: 1fr;
  }
}
</style>
