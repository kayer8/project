<template>
  <PageContainer title="管理费公开">
    <template #actions>
      <t-button variant="outline" @click="filterVisible = !filterVisible">
        {{ filterVisible ? '收起筛选' : '筛选' }}
      </t-button>
      <t-button variant="outline" @click="loadData">刷新统计</t-button>
    </template>

    <section class="admin-panel">
      <div class="admin-panel__header">
        <div>
          <div class="admin-panel__title">统计明细</div>
        </div>
      </div>
      <div class="admin-panel__body">
        <div v-if="filterVisible" class="inline-filter-panel">
          <div class="inline-filter-panel__header">
            <div class="inline-filter-panel__title">筛选查询</div>
          </div>
          <div class="filter-grid">
            <t-input
              v-model="filters.periodMonth"
              clearable
              placeholder="统计月份，例如 2026-03"
            />
            <t-input v-model="filters.keyword" clearable placeholder="搜索楼栋、房号或房屋名称" />
            <t-select v-model="filters.buildingId" :options="buildingOptions" />
            <t-select v-model="filters.paymentStatus" :options="managementFeeStatusOptions" />
            <div class="toolbar-actions">
              <t-button theme="primary" @click="handleSearch">查询</t-button>
              <t-button variant="outline" @click="resetFilters">重置</t-button>
            </div>
          </div>
        </div>

        <t-tabs v-model="activeTableTab" theme="card" class="management-fee-tabs">
          <t-tab-panel value="building" label="楼栋汇总">
            <t-table
              :data="buildingStats"
              :columns="buildingColumns"
              row-key="buildingId"
              size="small"
              bordered
              hover
            >
              <template #receivableAmount="{ row }">{{ formatCurrency(row.receivableAmount) }}</template>
              <template #paidAmount="{ row }">{{ formatCurrency(row.paidAmount) }}</template>
              <template #outstandingAmount="{ row }">{{ formatCurrency(row.outstandingAmount) }}</template>
              <template #paymentRate="{ row }">{{ formatPercent(row.paymentRate) }}</template>
              <template #paidHouseRate="{ row }">{{ formatPercent(row.paidHouseRate) }}</template>
            </t-table>
          </t-tab-panel>

          <t-tab-panel value="house" label="房屋台账">
            <t-table
              :data="houseRecords"
              :columns="houseColumns"
              row-key="id"
              size="small"
              table-layout="fixed"
              bordered
              hover
            >
              <template #displayName="{ row }">
                <div class="table-primary-cell">
                  <div class="table-primary-cell__title">{{ row.displayName }}</div>
                  <div class="table-subtext">{{ row.buildingName }} / {{ row.roomNo }}</div>
                </div>
              </template>

              <template #grossArea="{ row }">{{ formatArea(row.grossArea) }}</template>
              <template #unitPrice="{ row }">{{ formatUnitPrice(row.unitPrice) }}</template>
              <template #receivableAmount="{ row }">{{ formatCurrency(row.receivableAmount) }}</template>
              <template #paidAmount="{ row }">{{ formatCurrency(row.paidAmount) }}</template>
              <template #outstandingAmount="{ row }">{{ formatCurrency(row.outstandingAmount) }}</template>
              <template #paymentRate="{ row }">{{ formatPercent(row.paymentRate) }}</template>
              <template #paymentStatus="{ row }">
                <t-tag :theme="getStatusTheme(row.paymentStatus)" variant="light-outline">
                  {{ row.paymentStatusLabel }}
                </t-tag>
              </template>
              <template #lastPaidAt="{ row }">
                {{ formatDateTime(row.lastPaidAt) }}
              </template>
              <template #actions="{ row }">
                <div class="action-link-group">
                  <t-button variant="text" theme="primary" @click="openDetail(row)">详情</t-button>
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
          </t-tab-panel>
        </t-tabs>
      </div>
    </section>

    <t-dialog
      v-model:visible="detailVisible"
      header="管理费统计详情"
      width="640px"
      :footer="false"
      destroy-on-close
    >
      <div v-if="currentRecord" class="detail-grid">
        <div class="detail-grid__item">
          <span>房屋</span>
          <strong>{{ currentRecord.displayName }}</strong>
        </div>
        <div class="detail-grid__item">
          <span>楼栋</span>
          <strong>{{ currentRecord.buildingName }}</strong>
        </div>
        <div class="detail-grid__item">
          <span>建筑面积</span>
          <strong>{{ formatArea(currentRecord.grossArea) }}</strong>
        </div>
        <div class="detail-grid__item">
          <span>单价</span>
          <strong>{{ formatUnitPrice(currentRecord.unitPrice) }}</strong>
        </div>
        <div class="detail-grid__item">
          <span>基础服务费</span>
          <strong>{{ formatCurrency(currentRecord.baseAmount) }}</strong>
        </div>
        <div class="detail-grid__item">
          <span>应收金额</span>
          <strong>{{ formatCurrency(currentRecord.receivableAmount) }}</strong>
        </div>
        <div class="detail-grid__item">
          <span>实收金额</span>
          <strong>{{ formatCurrency(currentRecord.paidAmount) }}</strong>
        </div>
        <div class="detail-grid__item">
          <span>未收金额</span>
          <strong>{{ formatCurrency(currentRecord.outstandingAmount) }}</strong>
        </div>
        <div class="detail-grid__item">
          <span>截至日期</span>
          <strong>{{ currentRecord.dueDate }}</strong>
        </div>
        <div class="detail-grid__item">
          <span>最近缴纳</span>
          <strong>{{ formatDateTime(currentRecord.lastPaidAt) }}</strong>
        </div>
      </div>
      <div class="dialog-note">
        当前统计口径为占位算法：按面积分档单价 + 每户固定基础服务费，后续可替换为正式收费规则。
      </div>
    </t-dialog>
  </PageContainer>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import PageContainer from '@/components/PageContainer/index.vue';
import { formatDateTime } from '@/utils/format';
import {
  fetchManagementFeeBuildings,
  fetchManagementFeeBuildingOptions,
  fetchManagementFeeHouses,
  fetchManagementFeeSummary,
} from '@/modules/management-fee/api';
import type {
  ManagementFeeBuildingStat,
  ManagementFeeHouseRecord,
  ManagementFeeSummary,
} from '@/modules/management-fee/types';
import { managementFeeStatusOptions } from '@/modules/management-fee/types';

const summary = ref<ManagementFeeSummary | null>(null);
const buildingStats = ref<ManagementFeeBuildingStat[]>([]);
const houseRecords = ref<ManagementFeeHouseRecord[]>([]);
const detailVisible = ref(false);
const currentRecord = ref<ManagementFeeHouseRecord | null>(null);
const activeTableTab = ref<'building' | 'house'>('building');
const filterVisible = ref(false);
const buildingOptions = ref([{ label: '全部楼栋', value: 'ALL' }]);
const filters = reactive({
  periodMonth: '',
  keyword: '',
  buildingId: 'ALL',
  paymentStatus: 'ALL',
});
const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0,
});

const buildingColumns = [
  { colKey: 'buildingName', title: '楼栋', minWidth: 160 },
  { colKey: 'houseCount', title: '户数', width: 100 },
  { colKey: 'receivableAmount', title: '应收金额', width: 140 },
  { colKey: 'paidAmount', title: '已收金额', width: 140 },
  { colKey: 'outstandingAmount', title: '未收金额', width: 140 },
  { colKey: 'paymentRate', title: '收缴率', width: 110 },
  { colKey: 'paidHouseRate', title: '缴清户占比', width: 120 },
];

const houseColumns = [
  { colKey: 'displayName', title: '房屋信息', minWidth: 240, ellipsis: true },
  { colKey: 'grossArea', title: '面积', width: 110 },
  { colKey: 'unitPrice', title: '单价', width: 110 },
  { colKey: 'receivableAmount', title: '应收', width: 120 },
  { colKey: 'paidAmount', title: '已收', width: 120 },
  { colKey: 'outstandingAmount', title: '未收', width: 120 },
  { colKey: 'paymentRate', title: '进度', width: 110 },
  { colKey: 'paymentStatus', title: '状态', width: 120 },
  { colKey: 'lastPaidAt', title: '最近缴纳', width: 160 },
  { colKey: 'actions', title: '操作', width: 100, fixed: 'right' },
];

function formatCurrency(value: number) {
  return `¥ ${value.toFixed(2)}`;
}

function formatUnitPrice(value: number) {
  return `¥ ${value.toFixed(2)}/㎡`;
}

function formatArea(value: number) {
  return `${value.toFixed(2)} ㎡`;
}

function formatPercent(value: number) {
  return `${value.toFixed(2)}%`;
}

function getStatusTheme(status: ManagementFeeHouseRecord['paymentStatus']) {
  if (status === 'PAID') return 'success';
  if (status === 'PARTIAL') return 'warning';
  if (status === 'OVERDUE') return 'danger';
  return 'default';
}

async function loadBuildingOptions() {
  const items = await fetchManagementFeeBuildingOptions();
  buildingOptions.value = [
    { label: '全部楼栋', value: 'ALL' },
    ...items.map((item) => ({
      label: `${item.buildingName} (${item.buildingCode})`,
      value: item.id,
    })),
  ];
}

async function loadData() {
  const periodMonth = filters.periodMonth.trim() || undefined;
  const [summaryResult, buildingResult, houseResult] = await Promise.all([
    fetchManagementFeeSummary(periodMonth),
    fetchManagementFeeBuildings(periodMonth),
    fetchManagementFeeHouses({
      page: pagination.page,
      pageSize: pagination.pageSize,
      periodMonth,
      keyword: filters.keyword.trim() || undefined,
      buildingId: filters.buildingId === 'ALL' ? undefined : filters.buildingId,
      paymentStatus:
        filters.paymentStatus === 'ALL'
          ? undefined
          : (filters.paymentStatus as ManagementFeeHouseRecord['paymentStatus']),
    }),
  ]);

  summary.value = summaryResult;
  buildingStats.value = buildingResult.items;
  houseRecords.value = houseResult.items;
  pagination.total = houseResult.total;

  if (!filters.periodMonth) {
    filters.periodMonth = houseResult.periodMonth;
  }
}

function handleSearch() {
  pagination.page = 1;
  void loadData();
}

function resetFilters() {
  filters.periodMonth = summary.value?.periodMonth ?? '';
  filters.keyword = '';
  filters.buildingId = 'ALL';
  filters.paymentStatus = 'ALL';
  pagination.page = 1;
  void loadData();
}

function handlePageChange(pageInfo: { current: number; pageSize: number }) {
  pagination.page = pageInfo.current;
  pagination.pageSize = pageInfo.pageSize;
  void loadData();
}

function openDetail(record: ManagementFeeHouseRecord) {
  currentRecord.value = record;
  detailVisible.value = true;
}

onMounted(async () => {
  await loadBuildingOptions();
  await loadData();
});
</script>

<style scoped lang="scss">
.management-fee-tabs {
  :deep(.t-tabs__content) {
    padding-top: 16px;
  }
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.detail-grid__item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px;
  border: 1px solid var(--td-component-border);
  border-radius: 8px;
  background: #f8fafc;
}

.detail-grid__item span {
  font-size: 12px;
  color: #667085;
}

.detail-grid__item strong {
  font-size: 14px;
  color: #1f2329;
}

.dialog-note {
  margin-top: 16px;
  color: #667085;
  font-size: 12px;
  line-height: 1.6;
}
</style>
