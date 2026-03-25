<template>
  <PageContainer title="业主列表">
    <template #actions>
      <div class="page-header__search-actions">
        <t-input
          v-model="quickKeyword"
          class="page-header__search-input"
          clearable
          placeholder="快速搜索姓名、昵称、手机号、房号"
        />
        <t-button variant="outline" @click="filterVisible = !filterVisible">
          {{ filterVisible ? '收起筛选' : '筛选' }}
        </t-button>
      </div>
    </template>

    <section class="admin-panel">
      <div class="admin-panel__header">
        <div>
          <div class="admin-panel__title">业主台账</div>
        </div>
      </div>
      <div class="admin-panel__body">
        <div v-if="filterVisible" class="inline-filter-panel">
          <div class="inline-filter-panel__header">
            <div class="inline-filter-panel__title">筛选查询</div>
          </div>
          <div class="filter-grid">
            <t-select v-model="filters.buildingId" :options="buildingOptions" />
            <t-select v-model="filters.authStatus" :options="ownerAuthStatusOptions" />
            <t-select v-model="filters.voteQualification" :options="voteQualificationOptions" />
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

        <t-table :data="owners" :columns="columns" row-key="id" size="small" table-layout="fixed" bordered hover>
          <template #nameCell="{ row }">
            <div class="table-primary-cell">
              <div class="table-primary-cell__title">{{ row.name }}</div>
              <div class="table-subtext">{{ row.mobile }} / {{ row.identity }}</div>
            </div>
          </template>

          <template #authStatus="{ row }">
            <t-tag :theme="getAuthTheme(row.authStatus)" variant="light-outline">
              {{ row.authStatusLabel }}
            </t-tag>
          </template>

          <template #voteQualification="{ row }">
            <t-tag :theme="getVoteTheme(row.voteQualification)" variant="light-outline">
              {{ row.voteQualificationLabel }}
            </t-tag>
          </template>

          <template #updatedAt="{ row }">
            {{ formatDateTime(row.updatedAt) }}
          </template>

          <template #actions="{ row }">
            <div class="action-link-group">
              <t-button variant="text" @click="openEdit(row.userId)">编辑</t-button>
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

    <UserFormDialog
      v-model:visible="formDialogVisible"
      :mode="dialogMode"
      :initial-value="editingUser"
      @success="handleDialogSuccess"
    />
  </PageContainer>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import PageContainer from '@/components/PageContainer/index.vue';
import { useQuickKeywordSearch } from '@/composables/useQuickKeywordSearch';
import { fetchBuildingOptions } from '@/modules/house/api';
import { fetchOwnerList } from '@/modules/owner/api';
import {
  ownerAuthStatusOptions,
  voteQualificationOptions,
  type OwnerAuthStatus,
  type OwnerListItem,
  type VoteQualification,
} from '@/modules/owner/types';
import { fetchUserDetail } from '@/modules/user/api';
import type { UserDetail } from '@/modules/user/types';
import { formatDateTime } from '@/utils/format';
import UserFormDialog from '@/views/user/components/UserFormDialog.vue';

const owners = ref<OwnerListItem[]>([]);
const editingUser = ref<UserDetail | null>(null);
const formDialogVisible = ref(false);
const dialogMode = ref<'create' | 'edit'>('edit');
const filterVisible = ref(false);
const buildingOptions = ref([{ label: '全部楼栋', value: 'ALL' }]);
const filters = reactive({
  keyword: '',
  buildingId: 'ALL',
  authStatus: 'ALL',
  voteQualification: 'ALL',
});
const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0,
});

const columns = [
  { colKey: 'nameCell', title: '住户信息', minWidth: 220, ellipsis: true },
  { colKey: 'house', title: '房号', width: 180, ellipsis: true },
  { colKey: 'buildingName', title: '楼栋', width: 140, ellipsis: true },
  { colKey: 'authStatus', title: '认证状态', width: 120 },
  { colKey: 'voteQualification', title: '投票资格', width: 120 },
  { colKey: 'updatedAt', title: '最近更新', width: 180 },
  { colKey: 'actions', title: '操作', width: 100, fixed: 'right' },
];

const { quickKeyword, setQuickKeyword, commitQuickKeyword, clearQuickKeywordTimer } =
  useQuickKeywordSearch((keyword) => {
    filters.keyword = keyword;
    pagination.page = 1;
    void loadList();
  });

function getAuthTheme(status: OwnerAuthStatus) {
  if (status === 'VERIFIED') return 'success';
  if (status === 'SUPPLEMENT_REQUIRED') return 'warning';
  return 'danger';
}

function getVoteTheme(status: VoteQualification) {
  if (status === 'QUALIFIED') return 'success';
  if (status === 'NEEDS_AUTHORIZATION') return 'warning';
  return 'danger';
}

async function loadBuildings() {
  const items = await fetchBuildingOptions();
  buildingOptions.value = [
    { label: '全部楼栋', value: 'ALL' },
    ...items.map((item) => ({ label: item.name, value: item.id })),
  ];
}

async function loadList() {
  const result = await fetchOwnerList({
    page: pagination.page,
    pageSize: pagination.pageSize,
    keyword: filters.keyword.trim() || undefined,
    buildingId: filters.buildingId === 'ALL' ? undefined : filters.buildingId,
    authStatus:
      filters.authStatus === 'ALL' ? undefined : (filters.authStatus as OwnerAuthStatus),
    voteQualification:
      filters.voteQualification === 'ALL'
        ? undefined
        : (filters.voteQualification as VoteQualification),
  });

  owners.value = result.items;
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
  filters.authStatus = 'ALL';
  filters.voteQualification = 'ALL';
  pagination.page = 1;
  void loadList();
}

function handlePageChange(pageInfo: { current: number; pageSize: number }) {
  pagination.page = pageInfo.current;
  pagination.pageSize = pageInfo.pageSize;
  void loadList();
}

async function openEdit(userId: string) {
  editingUser.value = await fetchUserDetail(userId);
  formDialogVisible.value = true;
}

async function handleDialogSuccess() {
  editingUser.value = null;
  await loadList();
}

onMounted(async () => {
  await loadBuildings();
  await loadList();
});
</script>
