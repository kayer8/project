<template>
  <PageContainer title="房屋数据">
    <template #actions>
      <t-button variant="outline" @click="filterVisible = !filterVisible">
        {{ filterVisible ? '收起筛选' : '筛选' }}
      </t-button>
      <t-button theme="primary" @click="openCreate">新建房屋</t-button>
    </template>

    <section class="admin-panel">
      <div class="admin-panel__header">
        <div>
          <div class="admin-panel__title">房屋列表</div>
        </div>
      </div>
      <div class="admin-panel__body">
        <div v-if="filterVisible" class="inline-filter-panel">
          <div class="inline-filter-panel__header">
            <div class="inline-filter-panel__title">筛选查询</div>
          </div>
          <div class="filter-grid">
            <t-input v-model="filters.keyword" clearable placeholder="搜索房屋名称、楼栋或房号" />
            <t-select v-model="filters.buildingId" :options="buildingOptions" />
            <t-select v-model="filters.houseStatus" :options="houseStatusOptions" />
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
          :data="houses"
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
          <template #displayName="{ row }">
            <div class="table-primary-cell">
              <div class="table-primary-cell__title">{{ row.displayName }}</div>
              <div class="table-subtext">
                {{ row.buildingName }} / {{ formatText(row.unitNo, '无单元') }} / {{ row.roomNo }}
              </div>
            </div>
          </template>

          <template #houseStatus="{ row }">
            <t-tag :theme="getHouseStatusTheme(row.houseStatus)" variant="light-outline">
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

    <HouseFormDialog
      v-model:visible="formDialogVisible"
      :mode="dialogMode"
      :initial-value="editingHouse"
      @success="handleDialogSuccess"
    />

    <HouseDetailDialog
      v-model:visible="detailDialogVisible"
      :detail-id="detailHouseId"
      @success="handleDialogSuccess"
    />
  </PageContainer>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { DialogPlugin, MessagePlugin } from 'tdesign-vue-next';
import PageContainer from '@/components/PageContainer/index.vue';
import { fetchBuildingOptions, fetchHouseDetail, fetchHouseList, removeHouse } from '@/modules/house/api';
import type { HouseDetail, HouseListItem } from '@/modules/house/types';
import { houseStatusLabelMap, houseStatusOptions } from '@/modules/house/types';
import { formatDateTime, formatText } from '@/utils/format';
import HouseDetailDialog from './components/HouseDetailDialog.vue';
import HouseFormDialog from './components/HouseFormDialog.vue';

const houses = ref<HouseListItem[]>([]);
const selectedRowKeys = ref<Array<string | number>>([]);
const editingHouse = ref<HouseDetail | null>(null);
const formDialogVisible = ref(false);
const dialogMode = ref<'create' | 'edit'>('create');
const detailDialogVisible = ref(false);
const detailHouseId = ref('');
const filterVisible = ref(false);
const buildingOptions = ref([{ label: '全部楼栋', value: 'ALL' }]);
const filters = reactive({
  keyword: '',
  buildingId: 'ALL',
  houseStatus: 'ALL',
});
const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0,
});

const columns = [
  { colKey: 'row-select', type: 'multiple', width: 48, fixed: 'left' },
  { colKey: 'displayName', title: '房屋信息', minWidth: 240, ellipsis: true },
  { colKey: 'houseStatus', title: '房屋状态', width: 120 },
  { colKey: 'activeHouseholdType', title: '当前住户组', width: 140, ellipsis: true },
  { colKey: 'memberCount', title: '成员数', width: 90 },
  { colKey: 'primaryRoleName', title: '主角色', width: 120, ellipsis: true },
  { colKey: 'createdAt', title: '创建时间', width: 160 },
  { colKey: 'actions', title: '操作', width: 180, fixed: 'right' },
];

function getHouseStatusTheme(status: HouseListItem['houseStatus']) {
  if (status === 'SELF_OCCUPIED') return 'success';
  if (status === 'RENTED') return 'warning';
  if (status === 'VACANT') return 'default';
  return 'primary';
}

async function loadBuildings() {
  const items = await fetchBuildingOptions();
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
    buildingId: filters.buildingId === 'ALL' ? undefined : filters.buildingId,
    houseStatus: filters.houseStatus === 'ALL' ? undefined : filters.houseStatus,
  });

  houses.value = result.items;
  pagination.total = result.total;
  selectedRowKeys.value = [];
}

function handleSearch() {
  pagination.page = 1;
  void loadList();
}

function resetFilters() {
  filters.keyword = '';
  filters.buildingId = 'ALL';
  filters.houseStatus = 'ALL';
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
  detailHouseId.value = id;
  detailDialogVisible.value = true;
}

function openCreate() {
  dialogMode.value = 'create';
  editingHouse.value = null;
  formDialogVisible.value = true;
}

async function openEdit(id: string) {
  dialogMode.value = 'edit';
  editingHouse.value = await fetchHouseDetail(id);
  formDialogVisible.value = true;
}

function confirmDelete(ids: string[]) {
  const dialog = DialogPlugin.confirm({
    header: '确认删除房屋',
    body: `将删除 ${ids.length} 条房屋记录，删除后不可恢复。`,
    confirmBtn: '确认删除',
    cancelBtn: '取消',
    onConfirm: async () => {
      await Promise.all(ids.map((id) => removeHouse(id)));
      if (houses.value.length === ids.length && pagination.page > 1) {
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
  editingHouse.value = null;
  await loadList();
}

onMounted(async () => {
  await loadBuildings();
  await loadList();
});
</script>
