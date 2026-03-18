<template>
  <PageContainer
    title="楼栋管理"
    description="管理楼栋档案，楼栋不再与社区绑定，房屋创建时可独立选择社区和楼栋。"
  >
    <t-row :gutter="[16, 16]">
      <t-col :span="6" v-for="item in summaryCards" :key="item.title">
        <t-card :title="item.title">
          <div class="summary-value">{{ item.value }}</div>
          <div class="summary-desc">{{ item.description }}</div>
        </t-card>
      </t-col>
    </t-row>

    <t-card title="筛选条件">
      <div class="toolbar">
        <t-input v-model="filters.keyword" clearable placeholder="搜索楼栋名称或编码" />
        <t-select v-model="filters.status" :options="buildingStatusOptions" />
        <div class="toolbar-actions">
          <t-button theme="primary" @click="handleSearch">查询</t-button>
          <t-button variant="outline" @click="resetFilters">重置</t-button>
          <t-button variant="outline" theme="primary" @click="openCreate">新建楼栋</t-button>
        </div>
      </div>
    </t-card>

    <t-card title="楼栋列表">
      <t-table :data="buildings" :columns="columns" row-key="id" size="small" table-layout="fixed">
        <template #buildingName="{ row }">
          <div class="primary-cell">
            <div class="primary-name">{{ row.buildingName }}</div>
            <div class="muted-text">编码 {{ row.buildingCode }}</div>
          </div>
        </template>

        <template #status="{ row }">
          <t-tag :theme="row.status === 'ACTIVE' ? 'success' : 'warning'" variant="light">
            {{ buildingStatusLabelMap[row.status] }}
          </t-tag>
        </template>

        <template #sortNo="{ row }">
          {{ formatText(row.sortNo, '未设置') }}
        </template>

        <template #updatedAt="{ row }">
          {{ formatDateTime(row.updatedAt) }}
        </template>

        <template #actions="{ row }">
          <div class="action-group">
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

    <BuildingFormDialog
      v-model:visible="dialogVisible"
      :mode="dialogMode"
      :initial-value="editingBuilding"
      @success="handleDialogSuccess"
    />
  </PageContainer>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import PageContainer from '@/components/PageContainer/index.vue';
import {
  fetchBuildingDetail,
  fetchBuildingList,
  removeBuilding,
} from '@/modules/building/api';
import type { BuildingDetail, BuildingListItem } from '@/modules/building/types';
import {
  buildingStatusLabelMap,
  buildingStatusOptions,
} from '@/modules/building/types';
import { formatDateTime, formatText } from '@/utils/format';
import BuildingFormDialog from './components/BuildingFormDialog.vue';

const buildings = ref<BuildingListItem[]>([]);
const editingBuilding = ref<BuildingDetail | null>(null);
const dialogVisible = ref(false);
const dialogMode = ref<'create' | 'edit'>('create');
const filters = reactive({
  keyword: '',
  status: 'ALL',
});
const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0,
});

const columns = [
  { colKey: 'buildingName', title: '楼栋', minWidth: 220 },
  { colKey: 'sortNo', title: '排序号', width: 120 },
  { colKey: 'status', title: '状态', width: 120 },
  { colKey: 'houseCount', title: '关联房屋数', width: 140 },
  { colKey: 'updatedAt', title: '更新时间', width: 180 },
  { colKey: 'actions', title: '操作', width: 160, fixed: 'right' },
];

const summaryCards = computed(() => {
  const activeCount = buildings.value.filter((item) => item.status === 'ACTIVE').length;
  const disabledCount = buildings.value.filter((item) => item.status === 'DISABLED').length;
  const houseCount = buildings.value.reduce((sum, item) => sum + item.houseCount, 0);

  return [
    { title: '楼栋总数', value: pagination.total, description: '按接口分页总量展示' },
    { title: '当前页启用', value: activeCount, description: '当前页启用中的楼栋数' },
    { title: '当前页停用', value: disabledCount, description: '当前页停用中的楼栋数' },
    { title: '当前页房屋数', value: houseCount, description: '当前页楼栋下的房屋总数' },
  ];
});

async function loadList() {
  const result = await fetchBuildingList({
    page: pagination.page,
    pageSize: pagination.pageSize,
    keyword: filters.keyword.trim() || undefined,
    status: filters.status === 'ALL' ? undefined : filters.status,
  });

  buildings.value = result.items;
  pagination.total = result.total;
}

function handleSearch() {
  pagination.page = 1;
  void loadList();
}

function resetFilters() {
  filters.keyword = '';
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
  editingBuilding.value = null;
  dialogVisible.value = true;
}

async function openEdit(id: string) {
  dialogMode.value = 'edit';
  editingBuilding.value = await fetchBuildingDetail(id);
  dialogVisible.value = true;
}

async function handleDelete(id: string) {
  if (!window.confirm('确认删除这栋楼吗？')) {
    return;
  }

  await removeBuilding(id);
  if (buildings.value.length === 1 && pagination.page > 1) {
    pagination.page -= 1;
  }
  await loadList();
}

async function handleDialogSuccess() {
  editingBuilding.value = null;
  await loadList();
}

onMounted(() => {
  void loadList();
});
</script>

<style scoped>
.toolbar {
  display: grid;
  grid-template-columns: 2fr 1fr auto;
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
