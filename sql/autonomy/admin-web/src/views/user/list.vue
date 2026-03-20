<template>
  <PageContainer
    title="用户数据管理"
    description="接入真实后台接口，支持居民账号的筛选、分页、新建、编辑和删除。"
  >
    <t-row :gutter="[16, 16]">
      <t-col :span="3" v-for="item in summaryCards" :key="item.title">
        <t-card :title="item.title">
          <div class="summary-value">{{ item.value }}</div>
          <div class="summary-desc">{{ item.description }}</div>
        </t-card>
      </t-col>
    </t-row>

    <t-card title="筛选条件">
      <div class="toolbar">
        <t-input v-model="filters.keyword" clearable placeholder="搜索姓名、昵称、手机号、OpenID" />
        <t-select v-model="filters.status" :options="userStatusOptions" />
        <t-select v-model="filters.communityId" :options="communityOptions" />
        <div class="toolbar-actions">
          <t-button theme="primary" @click="handleSearch">查询</t-button>
          <t-button variant="outline" @click="resetFilters">重置</t-button>
          <t-button variant="outline" theme="primary" @click="openCreate">新建用户</t-button>
        </div>
      </div>
    </t-card>

    <t-card title="用户列表">
      <t-table :data="users" :columns="columns" row-key="id" size="small" table-layout="fixed">
        <template #user="{ row }">
          <div class="user-cell">
            <div class="user-name">{{ row.realName }}</div>
            <div class="user-sub">{{ row.nickname }}</div>
            <div class="user-sub">{{ row.id }}</div>
          </div>
        </template>

        <template #status="{ row }">
          <t-tag :theme="getUserStatusTheme(row.status)" variant="light">
            {{ userStatusLabelMap[row.status] }}
          </t-tag>
        </template>

        <template #communities="{ row }">
          <div class="tag-group">
            <t-tag v-for="community in row.communityNames" :key="community" variant="light">
              {{ community }}
            </t-tag>
            <span v-if="row.communityNames.length === 0" class="muted-text">未绑定社区</span>
          </div>
        </template>

        <template #lastLoginAt="{ row }">
          {{ formatDateTime(row.lastLoginAt) }}
        </template>

        <template #actions="{ row }">
          <div class="action-group">
            <t-button variant="text" theme="primary" @click="openDetail(row.id)">详情</t-button>
            <t-button variant="text" @click="openEdit(row.id)">编辑</t-button>
            <t-button variant="text" theme="danger" @click="handleDelete(row.id)">删除</t-button>
          </div>
        </template>
      </t-table>

      <div class="pagination-row">
        <t-pagination
          :current="pagination.page"
          :page-size="pagination.pageSize"
          :total="pagination.total"
          show-jumper
          show-page-size
          @change="handlePageChange"
        />
      </div>
    </t-card>

    <UserFormDialog
      v-model:visible="formDialogVisible"
      :mode="dialogMode"
      :initial-value="editingUser"
      @success="handleDialogSuccess"
    />

    <UserDetailDialog
      v-model:visible="detailDialogVisible"
      :detail-id="detailUserId"
      @success="handleDialogSuccess"
    />
  </PageContainer>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import PageContainer from '@/components/PageContainer/index.vue';
import { fetchCommunityOptions } from '@/modules/house/api';
import { fetchUserDetail, fetchUserList, removeUser } from '@/modules/user/api';
import type { UserDetail, UserListItem } from '@/modules/user/types';
import {
  userStatusLabelMap,
  userStatusOptions,
} from '@/modules/user/types';
import { formatDateTime } from '@/utils/format';
import UserDetailDialog from './components/UserDetailDialog.vue';
import UserFormDialog from './components/UserFormDialog.vue';

const users = ref<UserListItem[]>([]);
const editingUser = ref<UserDetail | null>(null);
const formDialogVisible = ref(false);
const dialogMode = ref<'create' | 'edit'>('create');
const detailDialogVisible = ref(false);
const detailUserId = ref('');
const communityOptions = ref([{ label: '全部社区', value: 'ALL' }]);
const filters = reactive({
  keyword: '',
  status: 'ALL',
  communityId: 'ALL',
});
const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0,
});

const columns = [
  { colKey: 'user', title: '用户', width: 220 },
  { colKey: 'mobile', title: '手机号', width: 150 },
  { colKey: 'status', title: '状态', width: 100 },
  { colKey: 'primaryRoleLabel', title: '主关系', width: 120 },
  { colKey: 'houseCount', title: '关联房屋', width: 100 },
  { colKey: 'communities', title: '所属社区', minWidth: 220 },
  { colKey: 'lastLoginAt', title: '最近登录', width: 160 },
  { colKey: 'actions', title: '操作', width: 180, fixed: 'right' },
];

const summaryCards = computed(() => {
  const activeCount = users.value.filter((item) => item.status === 'ACTIVE').length;
  const disabledCount = users.value.filter((item) => item.status === 'DISABLED').length;
  const houseCount = users.value.reduce((sum, item) => sum + item.houseCount, 0);

  return [
    { title: '用户总数', value: pagination.total, description: '按接口分页总量展示' },
    { title: '当前页正常', value: activeCount, description: '当前页正常账号数量' },
    { title: '当前页停用', value: disabledCount, description: '当前页停用账号数量' },
    { title: '当前页关联房屋', value: houseCount, description: '当前页聚合的房屋关系数' },
  ];
});

function getUserStatusTheme(status: UserListItem['status']) {
  if (status === 'ACTIVE') {
    return 'success';
  }
  if (status === 'DISABLED') {
    return 'warning';
  }
  return 'danger';
}

async function loadCommunities() {
  const items = await fetchCommunityOptions();
  communityOptions.value = [
    { label: '全部社区', value: 'ALL' },
    ...items.map((item) => ({ label: item.name, value: item.id })),
  ];
}

async function loadList() {
  const result = await fetchUserList({
    page: pagination.page,
    pageSize: pagination.pageSize,
    keyword: filters.keyword.trim() || undefined,
    status: filters.status === 'ALL' ? undefined : filters.status,
    communityId: filters.communityId === 'ALL' ? undefined : filters.communityId,
  });

  users.value = result.items;
  pagination.total = result.total;
}

function handleSearch() {
  pagination.page = 1;
  void loadList();
}

function resetFilters() {
  filters.keyword = '';
  filters.status = 'ALL';
  filters.communityId = 'ALL';
  pagination.page = 1;
  void loadList();
}

function handlePageChange(pageInfo: { current: number; pageSize: number }) {
  pagination.page = pageInfo.current;
  pagination.pageSize = pageInfo.pageSize;
  void loadList();
}

function openDetail(id: string) {
  detailUserId.value = id;
  detailDialogVisible.value = true;
}

function openCreate() {
  dialogMode.value = 'create';
  editingUser.value = null;
  formDialogVisible.value = true;
}

async function openEdit(id: string) {
  dialogMode.value = 'edit';
  editingUser.value = await fetchUserDetail(id);
  formDialogVisible.value = true;
}

async function handleDelete(id: string) {
  if (!window.confirm('确认删除这个用户吗？')) {
    return;
  }

  await removeUser(id);
  if (users.value.length === 1 && pagination.page > 1) {
    pagination.page -= 1;
  }
  await loadList();
}

async function handleDialogSuccess() {
  editingUser.value = null;
  await loadList();
}

onMounted(async () => {
  await loadCommunities();
  await loadList();
});
</script>

<style scoped>
.toolbar {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr auto;
  gap: 12px;
}

.toolbar-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.summary-value {
  font-size: 30px;
  font-weight: 700;
}

.summary-desc,
.user-sub,
.muted-text {
  margin-top: 8px;
  color: #64748b;
}

.user-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.user-name {
  font-weight: 600;
}

.tag-group,
.action-group {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.pagination-row {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}

@media (max-width: 1200px) {
  .toolbar {
    grid-template-columns: 1fr 1fr;
  }

  .toolbar-actions {
    grid-column: 1 / -1;
    justify-content: flex-start;
  }
}

@media (max-width: 768px) {
  .toolbar {
    grid-template-columns: 1fr;
  }
}
</style>
