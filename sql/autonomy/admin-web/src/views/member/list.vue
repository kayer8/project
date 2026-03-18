<template>
  <PageContainer
    title="成员关系管理"
    description="支持住户成员关系的筛选、分页、新建、编辑和删除，并关联到真实用户与房屋。"
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
        <t-input v-model="filters.keyword" clearable placeholder="搜索姓名、昵称、手机号或房屋" />
        <t-select v-model="filters.communityId" :options="communityOptions" />
        <t-select v-model="filters.relationType" :options="relationTypeOptions" />
        <t-select v-model="filters.status" :options="memberStatusOptions" />
        <div class="toolbar-actions">
          <t-button theme="primary" @click="handleSearch">查询</t-button>
          <t-button variant="outline" @click="resetFilters">重置</t-button>
          <t-button variant="outline" theme="primary" @click="openCreate">新建关系</t-button>
        </div>
      </div>
    </t-card>

    <t-card title="成员列表">
      <t-table :data="members" :columns="columns" row-key="id" size="small" table-layout="fixed">
        <template #user="{ row }">
          <div class="primary-cell">
            <div class="primary-name">{{ row.userName }}</div>
            <div class="muted-text">{{ formatText(row.nickname, '无昵称') }}</div>
            <div class="muted-text">{{ formatText(row.mobile, '未绑定手机号') }}</div>
          </div>
        </template>

        <template #location="{ row }">
          <div class="primary-cell">
            <div class="primary-name">{{ row.communityName }}</div>
            <div class="muted-text">{{ row.buildingName }} / {{ row.houseDisplayName }}</div>
          </div>
        </template>

        <template #relation="{ row }">
          <div class="tag-group">
            <t-tag v-if="row.isPrimaryRole" theme="primary" variant="light">主角色</t-tag>
            <span>{{ memberRelationLabelMap[row.relationType] }}</span>
          </div>
        </template>

        <template #status="{ row }">
          <t-tag :theme="getStatusTheme(row.status)" variant="light">
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
          <div class="action-group">
            <t-button variant="text" theme="primary" @click="goDetail(row.id)">详情</t-button>
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

    <MemberFormDialog
      v-model:visible="dialogVisible"
      :mode="dialogMode"
      :initial-value="editingMember"
      @success="handleDialogSuccess"
    />
  </PageContainer>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import PageContainer from '@/components/PageContainer/index.vue';
import { fetchCommunityOptions } from '@/modules/house/api';
import { fetchMemberDetail, fetchMemberList, removeMember } from '@/modules/member/api';
import type { MemberDetail, MemberListItem } from '@/modules/member/types';
import {
  memberRelationLabelMap,
  memberRelationOptions,
  memberRelationStatusLabelMap,
  memberStatusOptions,
} from '@/modules/member/types';
import { formatDateTime, formatText } from '@/utils/format';
import MemberFormDialog from './components/MemberFormDialog.vue';

const router = useRouter();
const members = ref<MemberListItem[]>([]);
const editingMember = ref<MemberDetail | null>(null);
const dialogVisible = ref(false);
const dialogMode = ref<'create' | 'edit'>('create');
const communityOptions = ref([{ label: '全部社区', value: 'ALL' }]);
const relationTypeOptions = [
  { label: '全部关系', value: 'ALL' },
  ...memberRelationOptions,
];
const filters = reactive({
  keyword: '',
  status: 'ALL',
  relationType: 'ALL',
  communityId: 'ALL',
});
const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0,
});

const columns = [
  { colKey: 'user', title: '用户', minWidth: 200 },
  { colKey: 'location', title: '社区 / 房屋', minWidth: 220 },
  { colKey: 'householdType', title: '住户组', width: 140 },
  { colKey: 'relation', title: '关系', width: 140 },
  { colKey: 'status', title: '状态', width: 100 },
  { colKey: 'effectiveAt', title: '生效时间', width: 160 },
  { colKey: 'expiredAt', title: '失效时间', width: 160 },
  { colKey: 'actions', title: '操作', width: 180, fixed: 'right' },
];

const summaryCards = computed(() => {
  const activeCount = members.value.filter((item) => item.status === 'ACTIVE').length;
  const primaryCount = members.value.filter((item) => item.isPrimaryRole).length;
  const expiringCount = members.value.filter((item) => Boolean(item.expiredAt)).length;

  return [
    { title: '关系总数', value: pagination.total, description: '按接口分页总量展示' },
    { title: '当前页有效', value: activeCount, description: '当前页有效成员关系数量' },
    { title: '当前页主角色', value: primaryCount, description: '当前页主角色关系数量' },
    { title: '当前页有失效日', value: expiringCount, description: '当前页设置了失效时间的关系' },
  ];
});

function getStatusTheme(status: MemberListItem['status']) {
  if (status === 'ACTIVE') {
    return 'success';
  }
  if (status === 'PENDING') {
    return 'warning';
  }
  if (status === 'REJECTED' || status === 'REMOVED') {
    return 'danger';
  }
  return 'default';
}

async function loadCommunities() {
  const items = await fetchCommunityOptions();
  communityOptions.value = [
    { label: '全部社区', value: 'ALL' },
    ...items.map((item) => ({ label: item.name, value: item.id })),
  ];
}

async function loadList() {
  const result = await fetchMemberList({
    page: pagination.page,
    pageSize: pagination.pageSize,
    keyword: filters.keyword.trim() || undefined,
    status: filters.status === 'ALL' ? undefined : filters.status,
    relationType: filters.relationType === 'ALL' ? undefined : filters.relationType,
    communityId: filters.communityId === 'ALL' ? undefined : filters.communityId,
  });

  members.value = result.items;
  pagination.total = result.total;
}

function handleSearch() {
  pagination.page = 1;
  void loadList();
}

function resetFilters() {
  filters.keyword = '';
  filters.status = 'ALL';
  filters.relationType = 'ALL';
  filters.communityId = 'ALL';
  pagination.page = 1;
  void loadList();
}

function handlePageChange(pageInfo: { current: number; pageSize: number }) {
  pagination.page = pageInfo.current;
  pagination.pageSize = pageInfo.pageSize;
  void loadList();
}

function goDetail(id: string) {
  void router.push(`/members/${id}`);
}

function openCreate() {
  dialogMode.value = 'create';
  editingMember.value = null;
  dialogVisible.value = true;
}

async function openEdit(id: string) {
  dialogMode.value = 'edit';
  editingMember.value = await fetchMemberDetail(id);
  dialogVisible.value = true;
}

async function handleDelete(id: string) {
  if (!window.confirm('确认删除这个成员关系吗？')) {
    return;
  }

  await removeMember(id);
  if (members.value.length === 1 && pagination.page > 1) {
    pagination.page -= 1;
  }
  await loadList();
}

async function handleDialogSuccess() {
  editingMember.value = null;
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
  grid-template-columns: 2fr 1fr 1fr 1fr auto;
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
.muted-text {
  margin-top: 8px;
  color: #64748b;
}

.primary-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.primary-name {
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
