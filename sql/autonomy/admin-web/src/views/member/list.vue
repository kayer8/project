<template>
  <PageContainer title="成员关系">
    <template #actions>
      <t-button theme="primary" @click="openCreate">新建关系</t-button>
    </template>

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
          <div class="admin-panel__title">筛选查询</div>
          <div class="admin-panel__desc">支持按成员身份、关系类型和状态快速排查异常关系。</div>
        </div>
      </div>
      <div class="admin-panel__body">
        <div class="filter-grid">
          <t-input v-model="filters.keyword" clearable placeholder="搜索姓名、昵称、手机号或房屋" />
          <t-select v-model="filters.relationType" :options="relationTypeOptions" />
          <t-select v-model="filters.status" :options="memberStatusOptions" />
          <div class="toolbar-actions">
            <t-button theme="primary" @click="handleSearch">查询</t-button>
            <t-button variant="outline" @click="resetFilters">重置</t-button>
          </div>
        </div>
      </div>
    </section>

    <section class="admin-panel">
      <div class="admin-panel__header">
        <div>
          <div class="admin-panel__title">成员列表</div>
          <div class="admin-panel__desc">操作入口统一收敛到右侧，便于集中审核、编辑和移除成员关系。</div>
        </div>
      </div>
      <div class="admin-panel__body">
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
          :data="members"
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
              <div class="table-primary-cell__title">{{ row.userName }}</div>
              <div class="table-subtext">{{ formatText(row.nickname, '无昵称') }}</div>
              <div class="table-subtext">{{ formatText(row.mobile, '未绑定手机号') }}</div>
            </div>
          </template>

          <template #location="{ row }">
            <div class="table-primary-cell">
              <div class="table-primary-cell__title">{{ row.buildingName }}</div>
              <div class="table-subtext">{{ row.houseDisplayName }}</div>
            </div>
          </template>

          <template #relation="{ row }">
            <div class="table-tag-list">
              <t-tag v-if="row.isPrimaryRole" theme="primary" variant="light-outline">主角色</t-tag>
              <span>{{ memberRelationLabelMap[row.relationType] }}</span>
            </div>
          </template>

          <template #status="{ row }">
            <t-tag :theme="getStatusTheme(row.status)" variant="light-outline">
              {{ memberRelationStatusLabelMap[row.status] }}
            </t-tag>
          </template>

          <template #effectiveAt="{ row }">
            {{ formatDateTime(row.effectiveAt) }}
          </template>

          <template #expiredAt="{ row }">
            {{ formatDateTime(row.expiredAt, '未失效') }}
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

    <MemberFormDialog
      v-model:visible="formDialogVisible"
      :mode="dialogMode"
      :initial-value="editingMember"
      @success="handleDialogSuccess"
    />

    <MemberDetailDialog
      v-model:visible="detailDialogVisible"
      :detail-id="detailMemberId"
      @success="handleDialogSuccess"
    />
  </PageContainer>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { DialogPlugin, MessagePlugin } from 'tdesign-vue-next';
import PageContainer from '@/components/PageContainer/index.vue';
import { fetchMemberDetail, fetchMemberList, removeMember } from '@/modules/member/api';
import type { MemberDetail, MemberListItem } from '@/modules/member/types';
import {
  memberRelationLabelMap,
  memberRelationOptions,
  memberRelationStatusLabelMap,
  memberStatusOptions,
} from '@/modules/member/types';
import { formatDateTime, formatText } from '@/utils/format';
import MemberDetailDialog from './components/MemberDetailDialog.vue';
import MemberFormDialog from './components/MemberFormDialog.vue';

const members = ref<MemberListItem[]>([]);
const selectedRowKeys = ref<Array<string | number>>([]);
const editingMember = ref<MemberDetail | null>(null);
const formDialogVisible = ref(false);
const dialogMode = ref<'create' | 'edit'>('create');
const detailDialogVisible = ref(false);
const detailMemberId = ref('');
const relationTypeOptions = [{ label: '全部关系', value: 'ALL' }, ...memberRelationOptions];
const filters = reactive({
  keyword: '',
  status: 'ALL',
  relationType: 'ALL',
});
const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0,
});

const columns = [
  { colKey: 'row-select', type: 'multiple', width: 48, fixed: 'left' },
  { colKey: 'user', title: '成员信息', minWidth: 220, ellipsis: true },
  { colKey: 'location', title: '楼栋 / 房屋', minWidth: 220, ellipsis: true },
  { colKey: 'householdType', title: '住户组', width: 130, ellipsis: true },
  { colKey: 'relation', title: '关系', width: 150 },
  { colKey: 'status', title: '状态', width: 110 },
  { colKey: 'effectiveAt', title: '生效时间', width: 160 },
  { colKey: 'expiredAt', title: '失效时间', width: 160 },
  { colKey: 'actions', title: '操作', width: 180, fixed: 'right' },
];

const summaryCards = computed(() => {
  const activeCount = members.value.filter((item) => item.status === 'ACTIVE').length;
  const primaryCount = members.value.filter((item) => item.isPrimaryRole).length;
  const expiringCount = members.value.filter((item) => Boolean(item.expiredAt)).length;

  return [
    { title: '关系总数', value: pagination.total, description: '按当前检索条件返回的成员关系总量' },
    { title: '有效关系', value: activeCount, description: '当前分页内状态有效的成员关系数量' },
    { title: '主角色关系', value: primaryCount, description: '当前分页内被标记为主角色的关系数量' },
    { title: '设定失效时间', value: expiringCount, description: '当前分页内已设定失效时间的关系数量' },
  ];
});

function getStatusTheme(status: MemberListItem['status']) {
  if (status === 'ACTIVE') return 'success';
  if (status === 'PENDING') return 'warning';
  if (status === 'REJECTED' || status === 'REMOVED') return 'danger';
  return 'default';
}

async function loadList() {
  const result = await fetchMemberList({
    page: pagination.page,
    pageSize: pagination.pageSize,
    keyword: filters.keyword.trim() || undefined,
    status: filters.status === 'ALL' ? undefined : filters.status,
    relationType: filters.relationType === 'ALL' ? undefined : filters.relationType,
  });

  members.value = result.items;
  pagination.total = result.total;
  selectedRowKeys.value = [];
}

function handleSearch() {
  pagination.page = 1;
  void loadList();
}

function resetFilters() {
  filters.keyword = '';
  filters.status = 'ALL';
  filters.relationType = 'ALL';
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
  detailMemberId.value = id;
  detailDialogVisible.value = true;
}

function openCreate() {
  dialogMode.value = 'create';
  editingMember.value = null;
  formDialogVisible.value = true;
}

async function openEdit(id: string) {
  dialogMode.value = 'edit';
  editingMember.value = await fetchMemberDetail(id);
  formDialogVisible.value = true;
}

function confirmDelete(ids: string[]) {
  const dialog = DialogPlugin.confirm({
    header: '确认删除成员关系',
    body: `将删除 ${ids.length} 条成员关系记录，删除后需要重新建立授权。`,
    confirmBtn: '确认删除',
    cancelBtn: '取消',
    onConfirm: async () => {
      await Promise.all(ids.map((id) => removeMember(id)));
      if (members.value.length === ids.length && pagination.page > 1) {
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
  editingMember.value = null;
  await loadList();
}

onMounted(async () => {
  await loadList();
});
</script>
