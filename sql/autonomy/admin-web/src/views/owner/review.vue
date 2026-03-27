<template>
  <PageContainer title="认证审核">
    <template #actions>
      <div class="page-header__search-actions">
        <t-input
          v-model="quickKeyword"
          class="page-header__search-input"
          clearable
          placeholder="快速搜索姓名、手机号、房号、楼栋"
        />
        <t-button variant="outline" @click="filterVisible = !filterVisible">
          {{ filterVisible ? '收起筛选' : '筛选' }}
        </t-button>
      </div>
    </template>

    <section class="admin-panel">
      <div class="admin-panel__header">
        <div>
          <div class="admin-panel__title">审核列表</div>
        </div>
      </div>
      <div class="admin-panel__body">
        <div v-if="filterVisible" class="inline-filter-panel">
          <div class="inline-filter-panel__header">
            <div class="inline-filter-panel__title">筛选查询</div>
          </div>
          <div class="filter-grid">
            <t-select v-model="filters.buildingId" :options="buildingOptions" />
            <t-select v-model="filters.status" :options="ownerReviewStatusOptions" />
            <div class="toolbar-actions">
              <t-button theme="primary" @click="handleSearch">查询</t-button>
              <t-button variant="outline" @click="resetFilters">重置</t-button>
            </div>
          </div>
        </div>

        <div class="table-toolbar">
          <div class="table-toolbar__meta">
            <span>共 {{ pagination.total }} 条记录</span>
          </div>
        </div>

        <t-table
          :data="reviews"
          :columns="columns"
          row-key="id"
          size="small"
          table-layout="fixed"
          bordered
          hover
        >
          <template #nameCell="{ row }">
            <div class="table-primary-cell">
              <div class="table-primary-cell__title">{{ row.name }}</div>
              <div class="table-subtext">{{ row.mobile }} / {{ row.roleLabel }}</div>
            </div>
          </template>

          <template #status="{ row }">
            <t-tag :theme="getStatusTheme(row.status)" variant="light-outline">
              {{ row.statusLabel }}
            </t-tag>
          </template>

          <template #reviewNote="{ row }">
            {{ row.reviewNote || '-' }}
          </template>

          <template #submittedAt="{ row }">
            {{ formatDateTime(row.submittedAt) }}
          </template>

          <template #actions="{ row }">
            <div v-if="row.status === 'PENDING'" class="action-link-group">
              <t-button variant="text" theme="primary" @click="handleApprove(row)">通过</t-button>
              <t-button variant="text" theme="danger" @click="handleReject(row)">拒绝</t-button>
            </div>
            <span v-else class="table-subtext">已处理</span>
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
import { DialogPlugin, MessagePlugin } from 'tdesign-vue-next';
import PageContainer from '@/components/PageContainer/index.vue';
import { useQuickKeywordSearch } from '@/composables/useQuickKeywordSearch';
import { fetchBuildingOptions } from '@/modules/house/api';
import { fetchOwnerReviewList, reviewOwnerRequest } from '@/modules/owner/api';
import {
  ownerReviewStatusOptions,
  type OwnerReviewListItem,
  type OwnerReviewStatus,
} from '@/modules/owner/types';
import { formatDateTime } from '@/utils/format';

const reviews = ref<OwnerReviewListItem[]>([]);
const filterVisible = ref(false);
const buildingOptions = ref([{ label: '全部楼栋', value: 'ALL' }]);
const filters = reactive({
  keyword: '',
  buildingId: 'ALL',
  status: 'ALL',
});
const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0,
});

const columns = [
  { colKey: 'nameCell', title: '申请人', minWidth: 220, ellipsis: true },
  { colKey: 'house', title: '房屋', width: 180, ellipsis: true },
  { colKey: 'buildingName', title: '楼栋', width: 140, ellipsis: true },
  { colKey: 'status', title: '状态', width: 120 },
  { colKey: 'reviewNote', title: '审核说明', minWidth: 180, ellipsis: true },
  { colKey: 'submittedAt', title: '提交时间', width: 180 },
  { colKey: 'actions', title: '操作', width: 140, fixed: 'right' },
];

const { quickKeyword, setQuickKeyword, commitQuickKeyword, clearQuickKeywordTimer } =
  useQuickKeywordSearch((keyword) => {
    filters.keyword = keyword;
    pagination.page = 1;
    void loadList();
  });

function getStatusTheme(status: OwnerReviewStatus) {
  if (status === 'REVIEWED') return 'success';
  if (status === 'REJECTED') return 'danger';
  if (status === 'CANCELLED') return 'default';
  return 'warning';
}

async function loadBuildings() {
  const items = await fetchBuildingOptions();
  buildingOptions.value = [
    { label: '全部楼栋', value: 'ALL' },
    ...items.map((item) => ({ label: item.name, value: item.id })),
  ];
}

async function loadList() {
  const result = await fetchOwnerReviewList({
    page: pagination.page,
    pageSize: pagination.pageSize,
    keyword: filters.keyword.trim() || undefined,
    buildingId: filters.buildingId === 'ALL' ? undefined : filters.buildingId,
    status: filters.status === 'ALL' ? undefined : (filters.status as OwnerReviewStatus),
  });

  reviews.value = result.items;
  pagination.total = result.total;
}

function handleSearch() {
  commitQuickKeyword();
}

function resetFilters() {
  clearQuickKeywordTimer();
  setQuickKeyword('');
  filters.keyword = '';
  filters.buildingId = 'ALL';
  filters.status = 'ALL';
  pagination.page = 1;
  void loadList();
}

function handlePageChange(pageInfo: { current: number; pageSize: number }) {
  pagination.page = pageInfo.current;
  pagination.pageSize = pageInfo.pageSize;
  void loadList();
}

function handleApprove(row: OwnerReviewListItem) {
  const dialog = DialogPlugin.confirm({
    header: '确认通过该申请？',
    body: `通过后会将 ${row.house} 绑定到该住户名下，并生效对应房屋权限。`,
    confirmBtn: '确认通过',
    cancelBtn: '取消',
    onConfirm: async () => {
      await reviewOwnerRequest(row.id, {
        status: 'REVIEWED',
      });
      MessagePlugin.success('审核已通过');
      dialog.destroy();
      await loadList();
    },
    onClose: () => dialog.destroy(),
  });
}

function handleReject(row: OwnerReviewListItem) {
  const reviewNote = window.prompt('请输入拒绝说明（可选）', '') ?? undefined;
  if (reviewNote === undefined) {
    return;
  }

  const dialog = DialogPlugin.confirm({
    header: '确认拒绝该申请？',
    body: '拒绝后该申请将标记为已拒绝，住户需要重新提交。',
    confirmBtn: '确认拒绝',
    cancelBtn: '取消',
    onConfirm: async () => {
      await reviewOwnerRequest(row.id, {
        status: 'REJECTED',
        reviewNote: reviewNote.trim() || undefined,
      });
      MessagePlugin.success('申请已拒绝');
      dialog.destroy();
      await loadList();
    },
    onClose: () => dialog.destroy(),
  });
}

onMounted(async () => {
  await loadBuildings();
  await loadList();
});
</script>
