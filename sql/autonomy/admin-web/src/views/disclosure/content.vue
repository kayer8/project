<template>
  <PageContainer title="信息公开内容">
    <template #actions>
      <div class="page-header__search-actions">
        <t-input
          v-model="quickKeyword"
          class="page-header__search-input"
          clearable
          placeholder="快速搜索标题、发布单位、摘要或分类"
        />
        <t-button variant="outline" @click="filterVisible = !filterVisible">
          {{ filterVisible ? '收起筛选' : '筛选' }}
        </t-button>
        <t-button theme="primary" @click="openCreate">新建内容</t-button>
      </div>
    </template>

    <section class="admin-panel">
      <div class="admin-panel__header">
        <div>
          <div class="admin-panel__title">内容列表</div>
        </div>
      </div>
      <div class="admin-panel__body">
        <div v-if="filterVisible" class="inline-filter-panel">
          <div class="inline-filter-panel__header">
            <div class="inline-filter-panel__title">筛选条件</div>
          </div>
          <div class="filter-grid disclosure-filter-grid">
            <t-select v-model="filters.category" :options="disclosureContentCategoryOptions" />
            <t-select v-model="filters.status" :options="disclosureContentStatusOptions" />
            <div class="toolbar-actions">
              <t-button theme="primary" @click="handleSearch">查询</t-button>
              <t-button variant="outline" @click="resetFilters">重置</t-button>
            </div>
          </div>
        </div>

        <div class="table-toolbar">
          <div class="table-toolbar__meta">
            <span>共 {{ pagination.total }} 条内容</span>
          </div>
        </div>

        <t-table :data="records" :columns="columns" row-key="id" size="small" table-layout="fixed" bordered hover>
          <template #titleCell="{ row }">
            <div class="table-primary-cell">
              <div class="table-primary-cell__title">{{ row.title }}</div>
              <div class="table-subtext">{{ row.publisher }} / {{ row.summary || row.category }}</div>
            </div>
          </template>

          <template #status="{ row }">
            <t-tag :theme="disclosureContentStatusThemeMap[row.status]" variant="light-outline">
              {{ disclosureContentStatusLabelMap[row.status] }}
            </t-tag>
          </template>

          <template #publishWindow="{ row }">
            {{ formatPublishWindow(row.publishStartAt, row.publishEndAt) }}
          </template>

          <template #publishedAt="{ row }">
            {{ formatDateTime(row.publishedAt) }}
          </template>

          <template #publisher="{ row }">
            {{ row.publisher }}
          </template>

          <template #updatedAt="{ row }">
            {{ formatDateTime(row.updatedAt) }}
          </template>

          <template #actions="{ row }">
            <div class="action-link-group">
              <t-button variant="text" @click="openEdit(row.id)">编辑</t-button>
              <t-button
                variant="text"
                theme="primary"
                :disabled="row.status === 'PUBLISHED'"
                @click="handlePublish(row)"
              >
                {{ row.status === 'PUBLISHED' ? '已发布' : '发布' }}
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

    <DisclosureContentFormDialog
      v-model:visible="dialogVisible"
      :mode="dialogMode"
      :initial-value="editingRecord"
      @success="handleDialogSuccess"
    />
  </PageContainer>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref, watch } from 'vue';
import { DialogPlugin, MessagePlugin } from 'tdesign-vue-next';
import { useRoute } from 'vue-router';
import PageContainer from '@/components/PageContainer/index.vue';
import { useQuickKeywordSearch } from '@/composables/useQuickKeywordSearch';
import {
  fetchDisclosureContentDetail,
  fetchDisclosureContentList,
  publishDisclosureContent,
  removeDisclosureContent,
} from '@/modules/disclosure/api';
import type { DisclosureContentItem } from '@/modules/disclosure/types';
import {
  disclosureContentCategoryOptions,
  disclosureContentStatusLabelMap,
  disclosureContentStatusOptions,
  disclosureContentStatusThemeMap,
} from '@/modules/disclosure/types';
import { formatDate, formatDateTime } from '@/utils/format';
import DisclosureContentFormDialog from './components/DisclosureContentFormDialog.vue';

const records = ref<DisclosureContentItem[]>([]);
const editingRecord = ref<DisclosureContentItem | null>(null);
const dialogVisible = ref(false);
const dialogMode = ref<'create' | 'edit'>('create');
const filterVisible = ref(false);
const route = useRoute();
const filters = reactive({
  keyword: '',
  category: 'ALL',
  status: 'ALL',
});
const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0,
});

const columns = [
  { colKey: 'titleCell', title: '内容标题', minWidth: 300, ellipsis: true },
  { colKey: 'category', title: '分类', width: 140 },
  { colKey: 'publisher', title: '发布单位', width: 160 },
  { colKey: 'status', title: '状态', width: 110 },
  { colKey: 'publishWindow', title: '发布时间窗口', width: 220 },
  { colKey: 'publishedAt', title: '发布时间', width: 180 },
  { colKey: 'updatedAt', title: '最后更新', width: 180 },
  { colKey: 'actions', title: '操作', width: 180, fixed: 'right' },
];

const { quickKeyword, setQuickKeyword, commitQuickKeyword, clearQuickKeywordTimer } = useQuickKeywordSearch(
  (keyword) => {
    filters.keyword = keyword;
    pagination.page = 1;
    void loadList();
  },
);

function formatPublishWindow(startAt?: string | null, endAt?: string | null) {
  if (!startAt && !endAt) {
    return '长期展示';
  }

  if (startAt && endAt) {
    return `${formatDate(startAt)} 至 ${formatDate(endAt)}`;
  }

  return `${formatDate(startAt || endAt)} 起`;
}

async function loadList() {
  const result = await fetchDisclosureContentList({
    page: pagination.page,
    pageSize: pagination.pageSize,
    keyword: filters.keyword.trim() || undefined,
    category: filters.category === 'ALL' ? undefined : filters.category,
    status: filters.status === 'ALL' ? undefined : (filters.status as 'DRAFT' | 'PUBLISHED'),
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
  filters.category = 'ALL';
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
  editingRecord.value = {
    id: '',
    title: '',
    category: (filters.category === 'ALL' ? '通知公告' : filters.category) as DisclosureContentItem['category'],
    publisher: '',
    summary: null,
    content: '',
    status: 'DRAFT',
    publishStartAt: null,
    publishEndAt: null,
    publishedAt: null,
    createdAt: '',
    updatedAt: '',
  };
  dialogVisible.value = true;
}

async function openEdit(id: string) {
  dialogMode.value = 'edit';
  editingRecord.value = await fetchDisclosureContentDetail(id);
  dialogVisible.value = true;
}

function handleDelete(id: string, title: string) {
  const dialog = DialogPlugin.confirm({
    header: '确认删除内容',
    body: `将删除《${title}》，删除后不可恢复。`,
    confirmBtn: '确认删除',
    cancelBtn: '取消',
    onConfirm: async () => {
      await removeDisclosureContent(id);
      if (records.value.length === 1 && pagination.page > 1) {
        pagination.page -= 1;
      }
      await loadList();
      MessagePlugin.success('内容删除成功');
      dialog.destroy();
    },
    onClose: () => dialog.destroy(),
  });
}

function handlePublish(row: DisclosureContentItem) {
  if (row.status === 'PUBLISHED') {
    return;
  }

  const dialog = DialogPlugin.confirm({
    header: '确认发布内容',
    body: `将发布《${row.title}》，发布后将在信息公开中生效。`,
    confirmBtn: '确认发布',
    cancelBtn: '取消',
    onConfirm: async () => {
      await publishDisclosureContent(row.id);
      await loadList();
      MessagePlugin.success('内容发布成功');
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
  syncFiltersFromRoute();
  void loadList();
});

function syncFiltersFromRoute() {
  const category = typeof route.query.category === 'string' ? route.query.category : '';
  if (category && disclosureContentCategoryOptions.some((item) => item.value === category)) {
    filters.category = category;
    return;
  }

  filters.category = 'ALL';
}

watch(
  () => route.query.category,
  () => {
    syncFiltersFromRoute();
    pagination.page = 1;
    void loadList();
  },
);
</script>

<style scoped>
.disclosure-filter-grid {
  grid-template-columns: minmax(240px, 1fr) minmax(180px, 220px) auto;
}

@media (max-width: 1280px) {
  .disclosure-filter-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .disclosure-filter-grid {
    grid-template-columns: 1fr;
  }
}
</style>
