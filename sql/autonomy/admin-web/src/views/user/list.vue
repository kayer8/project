<template>
  <PageContainer title="用户数据">
    <template #actions>
      <div class="page-header__search-actions">
        <t-input
          v-model="quickKeyword"
          class="page-header__search-input"
          clearable
          placeholder="快速搜索姓名、昵称、手机号或 OpenID"
        />
        <t-button variant="outline" @click="filterVisible = !filterVisible">
          {{ filterVisible ? '收起筛选' : '筛选' }}
        </t-button>
        <t-button theme="primary" @click="openCreate">新建用户</t-button>
      </div>
    </template>

    <section class="admin-panel">
      <div class="admin-panel__header">
        <div>
          <div class="admin-panel__title">用户列表</div>
        </div>
      </div>
      <div class="admin-panel__body">
        <div v-if="filterVisible" class="inline-filter-panel">
          <div class="inline-filter-panel__header">
            <div class="inline-filter-panel__title">筛选查询</div>
          </div>
          <div class="filter-grid">
            <t-select v-model="filters.status" :options="userStatusOptions" />
            <t-select v-model="filters.communityId" :options="communityOptions" />
            <div class="toolbar-actions">
              <t-button theme="primary" @click="handleSearch">查询</t-button>
              <t-button variant="outline" @click="resetFilters">重置</t-button>
            </div>
          </div>
        </div>

        <div class="table-toolbar">
          <div class="table-toolbar__meta">
            <span>共 {{ pagination.total }} 条记录</span>
            <span v-if="selectedRowKeys.length" class="table-selection-count">
              已选 {{ selectedRowKeys.length }} 项
            </span>
          </div>
          <div class="table-toolbar__actions">
            <t-button
              variant="outline"
              theme="danger"
              :disabled="selectedRowKeys.length === 0"
              @click="handleBatchDelete"
            >
              批量删除
            </t-button>
          </div>
        </div>

        <t-table
          :data="users"
          :columns="columns"
          :selected-row-keys="selectedRowKeys"
          :row-selection-type="'multiple'"
          row-key="id"
          size="small"
          table-layout="fixed"
          bordered
          hover
          @select-change="handleSelectChange"
        >
          <template #user="{ row }">
            <div class="table-primary-cell">
              <div class="table-primary-cell__title">{{ row.realName }}</div>
              <div class="table-subtext">{{ formatText(row.nickname, '未设置昵称') }}</div>
              <div class="table-subtext">{{ row.id }}</div>
            </div>
          </template>

          <template #status="{ row }">
            <t-tag :theme="getUserStatusTheme(row.status)" variant="light-outline">
              {{ userStatusLabelMap[row.status] }}
            </t-tag>
          </template>

          <template #communities="{ row }">
            <div class="table-tag-list">
              <t-tag v-for="community in row.communityNames" :key="community" variant="light-outline">
                {{ community }}
              </t-tag>
              <span v-if="row.communityNames.length === 0" class="table-subtext">未绑定小区</span>
            </div>
          </template>

          <template #lastLoginAt="{ row }">
            {{ formatDateTime(row.lastLoginAt, '暂无记录') }}
          </template>

          <template #actions="{ row }">
            <div class="action-link-group">
              <t-button variant="text" theme="primary" @click="openDetail(row.id)">详情</t-button>
              <t-button variant="text" @click="openEdit(row.id)">编辑</t-button>
              <t-button variant="text" theme="danger" @click="handleDelete(row.id)">删除</t-button>
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

    <UserDetailDialog
      v-model:visible="detailDialogVisible"
      :detail-id="detailUserId"
      @success="handleDialogSuccess"
    />
  </PageContainer>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { DialogPlugin, MessagePlugin } from 'tdesign-vue-next';
import PageContainer from '@/components/PageContainer/index.vue';
import { useQuickKeywordSearch } from '@/composables/useQuickKeywordSearch';
import { fetchCommunityOptions } from '@/modules/house/api';
import { fetchUserDetail, fetchUserList, removeUser } from '@/modules/user/api';
import type { UserDetail, UserListItem } from '@/modules/user/types';
import { userStatusLabelMap, userStatusOptions } from '@/modules/user/types';
import { formatDateTime, formatText } from '@/utils/format';
import UserDetailDialog from './components/UserDetailDialog.vue';
import UserFormDialog from './components/UserFormDialog.vue';

const users = ref<UserListItem[]>([]);
const selectedRowKeys = ref<Array<string | number>>([]);
const editingUser = ref<UserDetail | null>(null);
const formDialogVisible = ref(false);
const dialogMode = ref<'create' | 'edit'>('create');
const detailDialogVisible = ref(false);
const detailUserId = ref('');
const filterVisible = ref(false);
const communityOptions = ref([{ label: '全部小区', value: 'ALL' }]);
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
  { colKey: 'row-select', type: 'multiple', width: 48, fixed: 'left' },
  { colKey: 'user', title: '用户信息', width: 240, ellipsis: true },
  { colKey: 'mobile', title: '手机号', width: 150, ellipsis: true },
  { colKey: 'status', title: '状态', width: 110 },
  { colKey: 'primaryRoleLabel', title: '当前主角色', width: 120, ellipsis: true },
  { colKey: 'houseCount', title: '关联房屋', width: 100 },
  { colKey: 'communities', title: '所属小区', minWidth: 220 },
  { colKey: 'lastLoginAt', title: '最近登录', width: 160 },
  { colKey: 'actions', title: '操作', width: 180, fixed: 'right' },
];

const { quickKeyword, setQuickKeyword, commitQuickKeyword, clearQuickKeywordTimer } = useQuickKeywordSearch(
  (keyword) => {
    filters.keyword = keyword;
    pagination.page = 1;
    void loadList();
  },
);

function getUserStatusTheme(status: UserListItem['status']) {
  if (status === 'ACTIVE') return 'success';
  if (status === 'DISABLED') return 'warning';
  return 'danger';
}

async function loadCommunities() {
  const items = await fetchCommunityOptions();
  communityOptions.value = [
    { label: '全部小区', value: 'ALL' },
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
  selectedRowKeys.value = [];
}

function handleSearch() {
  commitQuickKeyword();
}

function resetFilters() {
  clearQuickKeywordTimer();
  setQuickKeyword('');
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

function handleSelectChange(keys: Array<string | number>) {
  selectedRowKeys.value = keys;
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

function confirmDelete(ids: string[]) {
  const dialog = DialogPlugin.confirm({
    header: '确认删除用户',
    body: `将删除 ${ids.length} 条用户记录，删除后不可恢复。`,
    confirmBtn: '确认删除',
    cancelBtn: '取消',
    onConfirm: async () => {
      await Promise.all(ids.map((id) => removeUser(id)));
      if (users.value.length === ids.length && pagination.page > 1) {
        pagination.page -= 1;
      }
      await loadList();
      MessagePlugin.success('删除成功');
      dialog.destroy();
    },
    onClose: () => dialog.destroy(),
  });
}

function handleDelete(id: string) {
  confirmDelete([id]);
}

function handleBatchDelete() {
  confirmDelete(selectedRowKeys.value.map((item) => String(item)));
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
