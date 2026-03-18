<template>
  <PageContainer
    title="房屋数据管理"
    description="支持房屋档案的筛选、分页、新建、编辑和删除，并直接查看当前成员与住户组。"
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
        <t-input v-model="filters.keyword" clearable placeholder="搜索房屋名称、楼栋或房号" />
        <t-select v-model="filters.communityId" :options="communityOptions" />
        <t-select v-model="filters.buildingId" :options="buildingOptions" />
        <t-select v-model="filters.houseStatus" :options="houseStatusOptions" />
        <div class="toolbar-actions">
          <t-button theme="primary" @click="handleSearch">查询</t-button>
          <t-button variant="outline" @click="resetFilters">重置</t-button>
          <t-button variant="outline" theme="primary" @click="openCreate">新建房屋</t-button>
        </div>
      </div>
    </t-card>

    <t-card title="房屋列表">
      <t-table :data="houses" :columns="columns" row-key="id" size="small" table-layout="fixed">
        <template #displayName="{ row }">
          <div class="primary-cell">
            <div class="primary-name">{{ row.displayName }}</div>
            <div class="muted-text">
              {{ row.buildingName }} / {{ row.unitNo || '无单元' }} / {{ row.roomNo }}
            </div>
          </div>
        </template>

        <template #houseStatus="{ row }">
          <t-tag :theme="getHouseStatusTheme(row.houseStatus)" variant="light">
            {{ houseStatusLabelMap[row.houseStatus] }}
          </t-tag>
        </template>

        <template #activeHouseholdType="{ row }">
          {{ formatText(row.activeHouseholdType, '暂无') }}
        </template>

        <template #primaryRoleName="{ row }">
          {{ formatText(row.primaryRoleName, '暂无') }}
        </template>

        <template #createdAt="{ row }">
          {{ formatDateTime(row.createdAt) }}
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

    <HouseFormDialog
      v-model:visible="dialogVisible"
      :mode="dialogMode"
      :initial-value="editingHouse"
      @success="handleDialogSuccess"
    />
  </PageContainer>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import PageContainer from '@/components/PageContainer/index.vue';
import {
  fetchBuildingOptions,
  fetchCommunityOptions,
  fetchHouseDetail,
  fetchHouseList,
  removeHouse,
} from '@/modules/house/api';
import type { HouseDetail, HouseListItem } from '@/modules/house/types';
import { houseStatusLabelMap, houseStatusOptions } from '@/modules/house/types';
import { formatDateTime, formatText } from '@/utils/format';
import HouseFormDialog from './components/HouseFormDialog.vue';

const router = useRouter();
const houses = ref<HouseListItem[]>([]);
const editingHouse = ref<HouseDetail | null>(null);
const dialogVisible = ref(false);
const dialogMode = ref<'create' | 'edit'>('create');
const communityOptions = ref([{ label: '全部社区', value: 'ALL' }]);
const buildingOptions = ref([{ label: '全部楼栋', value: 'ALL' }]);
const filters = reactive({
  keyword: '',
  communityId: 'ALL',
  buildingId: 'ALL',
  houseStatus: 'ALL',
});
const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0,
});

const columns = [
  { colKey: 'displayName', title: '房屋', minWidth: 220 },
  { colKey: 'communityName', title: '社区', width: 140 },
  { colKey: 'houseStatus', title: '房屋状态', width: 120 },
  { colKey: 'activeHouseholdType', title: '当前住户组', width: 140 },
  { colKey: 'memberCount', title: '成员数', width: 90 },
  { colKey: 'primaryRoleName', title: '主角色', width: 120 },
  { colKey: 'createdAt', title: '创建时间', width: 160 },
  { colKey: 'actions', title: '操作', width: 180, fixed: 'right' },
];

const summaryCards = computed(() => {
  const selfOccupiedCount = houses.value.filter((item) => item.houseStatus === 'SELF_OCCUPIED').length;
  const rentedCount = houses.value.filter((item) => item.houseStatus === 'RENTED').length;
  const memberCount = houses.value.reduce((sum, item) => sum + item.memberCount, 0);

  return [
    { title: '房屋总数', value: pagination.total, description: '按接口分页总量展示' },
    { title: '当前页自住', value: selfOccupiedCount, description: '当前页自住房屋数量' },
    { title: '当前页出租', value: rentedCount, description: '当前页出租房屋数量' },
    { title: '当前页成员数', value: memberCount, description: '当前页聚合的成员关系数' },
  ];
});

function getHouseStatusTheme(status: HouseListItem['houseStatus']) {
  if (status === 'SELF_OCCUPIED') {
    return 'success';
  }
  if (status === 'RENTED') {
    return 'warning';
  }
  if (status === 'VACANT') {
    return 'default';
  }
  return 'primary';
}

async function loadCommunities() {
  const items = await fetchCommunityOptions();
  communityOptions.value = [
    { label: '全部社区', value: 'ALL' },
    ...items.map((item) => ({ label: item.name, value: item.id })),
  ];
}

async function loadBuildings(communityId?: string) {
  const items = await fetchBuildingOptions(communityId || undefined);
  buildingOptions.value = [
    { label: '全部楼栋', value: 'ALL' },
    ...items.map((item) => ({
      label: `${item.buildingName} (${item.buildingCode})`,
      value: item.id,
    })),
  ];
}

async function loadList() {
  const result = await fetchHouseList({
    page: pagination.page,
    pageSize: pagination.pageSize,
    keyword: filters.keyword.trim() || undefined,
    communityId: filters.communityId === 'ALL' ? undefined : filters.communityId,
    buildingId: filters.buildingId === 'ALL' ? undefined : filters.buildingId,
    houseStatus: filters.houseStatus === 'ALL' ? undefined : filters.houseStatus,
  });

  houses.value = result.items;
  pagination.total = result.total;
}

function handleSearch() {
  pagination.page = 1;
  void loadList();
}

function resetFilters() {
  filters.keyword = '';
  filters.communityId = 'ALL';
  filters.buildingId = 'ALL';
  filters.houseStatus = 'ALL';
  pagination.page = 1;
  void loadBuildings();
  void loadList();
}

function handlePageChange(pageInfo: { current: number; pageSize: number }) {
  pagination.page = pageInfo.current;
  pagination.pageSize = pageInfo.pageSize;
  void loadList();
}

function goDetail(id: string) {
  void router.push(`/houses/${id}`);
}

function openCreate() {
  dialogMode.value = 'create';
  editingHouse.value = null;
  dialogVisible.value = true;
}

async function openEdit(id: string) {
  dialogMode.value = 'edit';
  editingHouse.value = await fetchHouseDetail(id);
  dialogVisible.value = true;
}

async function handleDelete(id: string) {
  if (!window.confirm('确认删除这套房屋吗？')) {
    return;
  }

  await removeHouse(id);
  if (houses.value.length === 1 && pagination.page > 1) {
    pagination.page -= 1;
  }
  await loadList();
}

async function handleDialogSuccess() {
  editingHouse.value = null;
  await loadList();
}

watch(
  () => filters.communityId,
  async (communityId) => {
    const actualCommunityId = communityId === 'ALL' ? undefined : communityId;
    await loadBuildings(actualCommunityId);

    if (!buildingOptions.value.some((item) => item.value === filters.buildingId)) {
      filters.buildingId = 'ALL';
    }
  },
);

onMounted(async () => {
  await loadCommunities();
  await loadBuildings();
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
