<template>
  <PageContainer title="楼栋管理">
    <template #actions>
      <t-button variant="outline" @click="filterVisible = !filterVisible">
        {{ filterVisible ? '收起筛选' : '筛选' }}
      </t-button>
      <t-button theme="primary" @click="openCreate">新建楼栋</t-button>
    </template>

    <section class="admin-panel">
      <div class="admin-panel__header">
        <div>
          <div class="admin-panel__title">楼栋列表</div>
        </div>
      </div>
      <div class="admin-panel__body">
        <div v-if="filterVisible" class="inline-filter-panel">
          <div class="inline-filter-panel__header">
            <div class="inline-filter-panel__title">筛选查询</div>
          </div>
          <div class="filter-grid" style="grid-template-columns: minmax(280px, 2fr) minmax(180px, 1fr) auto;">
            <t-input v-model="filters.keyword" clearable placeholder="搜索楼栋名称或编码" />
            <t-select v-model="filters.status" :options="buildingStatusOptions" />
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
          :data="buildings"
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
          <template #buildingName="{ row }">
            <div class="table-primary-cell">
              <div class="table-primary-cell__title">{{ row.buildingName }}</div>
              <div class="table-subtext">编码 {{ row.buildingCode }}</div>
            </div>
          </template>

          <template #status="{ row }">
            <t-tag :theme="row.status === 'ACTIVE' ? 'success' : 'warning'" variant="light-outline">
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
            <div class="action-link-group">
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

    <BuildingFormDialog
      v-model:visible="dialogVisible"
      :mode="dialogMode"
      :initial-value="editingBuilding"
      @success="handleDialogSuccess"
    />
  </PageContainer>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { DialogPlugin, MessagePlugin } from 'tdesign-vue-next';
import PageContainer from '@/components/PageContainer/index.vue';
import { fetchBuildingDetail, fetchBuildingList, removeBuilding } from '@/modules/building/api';
import type { BuildingDetail, BuildingListItem } from '@/modules/building/types';
import { buildingStatusLabelMap, buildingStatusOptions } from '@/modules/building/types';
import { formatDateTime, formatText } from '@/utils/format';
import BuildingFormDialog from './components/BuildingFormDialog.vue';

const buildings = ref<BuildingListItem[]>([]);
const selectedRowKeys = ref<Array<string | number>>([]);
const editingBuilding = ref<BuildingDetail | null>(null);
const dialogVisible = ref(false);
const dialogMode = ref<'create' | 'edit'>('create');
const filterVisible = ref(false);
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
  { colKey: 'row-select', type: 'multiple', width: 48, fixed: 'left' },
  { colKey: 'buildingName', title: '楼栋信息', minWidth: 220, ellipsis: true },
  { colKey: 'sortNo', title: '排序号', width: 100 },
  { colKey: 'status', title: '状态', width: 120 },
  { colKey: 'houseCount', title: '关联房屋数', width: 120 },
  { colKey: 'updatedAt', title: '更新时间', width: 180 },
  { colKey: 'actions', title: '操作', width: 140, fixed: 'right' },
];

async function loadList() {
  const result = await fetchBuildingList({
    page: pagination.page,
    pageSize: pagination.pageSize,
    keyword: filters.keyword.trim() || undefined,
    status: filters.status === 'ALL' ? undefined : filters.status,
  });

  buildings.value = result.items;
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

function confirmDelete(ids: string[]) {
  const dialog = DialogPlugin.confirm({
    header: '确认删除楼栋',
    body: `将删除 ${ids.length} 条楼栋记录，请确认相关房屋关系已处理。`,
    confirmBtn: '确认删除',
    cancelBtn: '取消',
    onConfirm: async () => {
      await Promise.all(ids.map((id) => removeBuilding(id)));
      if (buildings.value.length === ids.length && pagination.page > 1) {
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
  editingBuilding.value = null;
  await loadList();
}

onMounted(() => {
  void loadList();
});
</script>
