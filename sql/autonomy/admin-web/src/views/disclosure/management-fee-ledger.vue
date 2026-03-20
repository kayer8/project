<template>
  <PageContainer title="管理费缴费账本">
    <template #actions>
      <div class="management-fee-ledger-actions">
        <t-input
          v-if="activeTab === 'ledger'"
          v-model="quickKeyword"
          class="management-fee-ledger-actions__search"
          clearable
          placeholder="快速搜索楼栋、房号或房屋名称"
        />
        <t-button v-if="activeTab === 'ledger'" variant="outline" @click="filterVisible = !filterVisible">
          {{ filterVisible ? '收起筛选' : '筛选' }}
        </t-button>
        <t-button variant="outline" @click="router.push('/disclosures/management-fees')">返回总览</t-button>
      </div>
    </template>

    <section class="admin-panel management-fee-ledger-panel">
      <div class="admin-panel__header">
        <div>
          <div class="admin-panel__title">{{ pageTitle }}</div>
        </div>
        <t-tag theme="primary" variant="light-outline">
          {{ formatPeriodRangeLabel(summary?.chargeStartDate, summary?.chargeEndDate) }}
        </t-tag>
      </div>

      <div class="admin-panel__body management-fee-ledger-panel__body">
        <div class="management-fee-period-meta">
          <div class="management-fee-period-meta__item">
            <span>管理时段</span>
            <strong>{{ formatDate(summary?.chargeStartDate) }} 至 {{ formatDate(summary?.chargeEndDate) }}</strong>
          </div>
          <div class="management-fee-period-meta__item">
            <span>截止日期</span>
            <strong>{{ formatDate(summary?.dueDate) }}</strong>
          </div>
          <div class="management-fee-period-meta__item">
            <span>覆盖房屋</span>
            <strong>{{ summary?.houseCount ?? 0 }} 户</strong>
          </div>
          <div class="management-fee-period-meta__item">
            <span>已缴清</span>
            <strong>{{ summary?.paidHouseholds ?? 0 }} 户</strong>
          </div>
          <div class="management-fee-period-meta__item">
            <span>收费标准</span>
            <strong>{{ pricingRuleLabel }}</strong>
          </div>
        </div>

        <t-tabs v-model="activeTab" theme="card" class="management-fee-ledger-tabs">
          <t-tab-panel value="building" label="楼栋汇总">
            <div class="table-pane">
              <t-table
                :data="displayedBuildingStats"
                :columns="buildingColumns"
                row-key="buildingId"
                size="small"
                bordered
                hover
                :max-height="buildingTableMaxHeight"
              >
                <template #buildingName="{ row }">
                  <span :class="{ 'summary-cell-text': row.isSummaryRow }">
                    {{ row.buildingName }}
                  </span>
                </template>
                <template #houseCount="{ row }">
                  <span :class="{ 'summary-cell-text': row.isSummaryRow }">
                    {{ row.houseCount }}
                  </span>
                </template>
                <template #receivableAmount="{ row }">
                  <span :class="{ 'summary-cell-text': row.isSummaryRow }">
                    {{ formatCurrency(row.receivableAmount) }}
                  </span>
                </template>
                <template #paidAmount="{ row }">
                  <span :class="{ 'summary-cell-text': row.isSummaryRow }">
                    {{ formatCurrency(row.paidAmount) }}
                  </span>
                </template>
                <template #outstandingAmount="{ row }">
                  <span :class="{ 'summary-cell-text': row.isSummaryRow }">
                    {{ formatCurrency(row.outstandingAmount) }}
                  </span>
                </template>
                <template #paymentRate="{ row }">
                  <span :class="{ 'summary-cell-text': row.isSummaryRow }">
                    {{ formatPercent(row.paymentRate) }}
                  </span>
                </template>
                <template #paidHouseRate="{ row }">
                  <span :class="{ 'summary-cell-text': row.isSummaryRow }">
                    {{ formatPercent(row.paidHouseRate) }}
                  </span>
                </template>
              </t-table>
            </div>
          </t-tab-panel>

          <t-tab-panel value="ledger" label="账目明细">
            <div class="table-pane">
              <div v-if="filterVisible" class="inline-filter-panel">
                <div class="inline-filter-panel__header">
                  <div class="inline-filter-panel__title">筛选查询</div>
                </div>
                <div class="filter-grid">
                  <t-select v-model="filters.buildingId" :options="buildingOptions" />
                  <t-select v-model="filters.paymentStatus" :options="statusFilterOptions" />
                  <div class="toolbar-actions">
                    <t-button theme="primary" @click="handleSearch">查询</t-button>
                    <t-button variant="outline" @click="resetFilters">重置</t-button>
                  </div>
                </div>
              </div>

              <t-table
                :data="houseRecords"
                :columns="houseColumns"
                row-key="id"
                size="small"
                table-layout="fixed"
                bordered
                hover
                :max-height="ledgerTableMaxHeight"
              >
                <template #displayName="{ row }">
                  <div class="table-primary-cell">
                    <div class="table-primary-cell__title">{{ row.displayName }}</div>
                    <div class="table-subtext">{{ row.buildingName }} / {{ row.roomNo }}</div>
                  </div>
                </template>
                <template #grossArea="{ row }">{{ formatAreaValue(row.grossArea) }}</template>
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
                    <t-button variant="text" theme="primary" @click="openStatusDialog(row)">修改状态</t-button>
                    <t-button variant="text" @click="openDetail(row)">详情</t-button>
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
          </t-tab-panel>
        </t-tabs>
      </div>
    </section>

    <t-dialog
      v-model:visible="statusDialogVisible"
      header="修改缴纳状态"
      width="480px"
      confirm-btn="保存"
      :confirm-loading="statusSubmitting"
      @confirm="handleStatusSubmit"
      @close="handleStatusDialogClose"
    >
      <div v-if="editingRecord" class="status-dialog-content">
        <div class="status-dialog-summary">
          <div class="status-dialog-summary__title">{{ editingRecord.displayName }}</div>
          <div class="table-subtext">{{ editingRecord.buildingName }} / {{ editingRecord.roomNo }}</div>
        </div>
        <t-select v-model="editingStatus" :options="editableStatusOptions" placeholder="请选择缴纳状态" />
      </div>
    </t-dialog>

    <t-dialog
      v-model:visible="detailVisible"
      header="管理费账目详情"
      width="640px"
      :footer="false"
      destroy-on-close
    >
      <div v-if="currentRecord" class="detail-grid">
        <div class="detail-grid__item">
          <span>账期</span>
          <strong>{{ formatDate(currentRecord.chargeStartDate) }} 至 {{ formatDate(currentRecord.chargeEndDate) }}</strong>
        </div>
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
          <strong>{{ formatAreaValue(currentRecord.grossArea) }}</strong>
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
          <span>截止日期</span>
          <strong>{{ formatDate(currentRecord.dueDate) }}</strong>
        </div>
        <div class="detail-grid__item">
          <span>最近缴纳</span>
          <strong>{{ formatDateTime(currentRecord.lastPaidAt) }}</strong>
        </div>
      </div>
    </t-dialog>
  </PageContainer>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import { MessagePlugin } from 'tdesign-vue-next';
import { useRoute, useRouter } from 'vue-router';
import PageContainer from '@/components/PageContainer/index.vue';
import { formatDate, formatDateTime } from '@/utils/format';
import {
  fetchManagementFeeBuildingOptions,
  fetchManagementFeeBuildings,
  fetchManagementFeeHouses,
  fetchManagementFeeSummary,
  updateManagementFeeStatus,
} from '@/modules/management-fee/api';
import type {
  ManagementFeeBuildingStat,
  ManagementFeeHouseRecord,
  ManagementFeePaymentStatus,
  ManagementFeeSummary,
} from '@/modules/management-fee/types';

type BuildingStatRow = ManagementFeeBuildingStat & { isSummaryRow?: boolean };

const statusFilterOptions = [
  { label: '全部状态', value: 'ALL' },
  { label: '已缴清', value: 'PAID' },
  { label: '部分缴纳', value: 'PARTIAL' },
  { label: '待缴纳', value: 'PENDING' },
  { label: '逾期未缴', value: 'OVERDUE' },
];

const editableStatusOptions = statusFilterOptions.filter((item) => item.value !== 'ALL');

const route = useRoute();
const router = useRouter();

const activeTab = ref<'building' | 'ledger'>('building');
const filterVisible = ref(false);
const quickKeyword = ref('');
const summary = ref<ManagementFeeSummary | null>(null);
const buildingStats = ref<ManagementFeeBuildingStat[]>([]);
const houseRecords = ref<ManagementFeeHouseRecord[]>([]);
const detailVisible = ref(false);
const currentRecord = ref<ManagementFeeHouseRecord | null>(null);
const statusDialogVisible = ref(false);
const statusSubmitting = ref(false);
const editingRecord = ref<ManagementFeeHouseRecord | null>(null);
const editingStatus = ref<ManagementFeePaymentStatus>('PENDING');
const buildingOptions = ref([{ label: '全部楼栋', value: 'ALL' }]);
const filters = reactive({
  keyword: '',
  buildingId: 'ALL',
  paymentStatus: 'ALL',
});
const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0,
});

const buildingTableMaxHeight = 'calc(100vh - 390px)';
const ledgerTableMaxHeight = computed(() =>
  filterVisible.value ? 'calc(100vh - 560px)' : 'calc(100vh - 460px)',
);
const periodKey = computed(() => String(route.params.periodKey ?? '').trim());

let keywordSearchTimer: ReturnType<typeof setTimeout> | null = null;
let skipQuickKeywordWatch = false;

const pageTitle = computed(() => {
  const label = formatPeriodRangeLabel(summary.value?.chargeStartDate, summary.value?.chargeEndDate);
  return label === '-' ? '管理费缴费账本' : `${label} 缴费账目`;
});

const pricingRuleLabel = computed(() => {
  const rule = summary.value?.calculationRule;
  if (!rule) {
    return '-';
  }

  return `¥ ${Number(rule.unitPrice ?? 0).toFixed(2)}/㎡ + 固定 ¥ ${Number(rule.baseAmount ?? 0).toFixed(2)}`;
});

const buildingSummary = computed(() => {
  const totals = buildingStats.value.reduce(
    (acc, item) => {
      acc.houseCount += item.houseCount;
      acc.receivableAmount += item.receivableAmount;
      acc.paidAmount += item.paidAmount;
      acc.outstandingAmount += item.outstandingAmount;
      acc.paidHouseCount += item.paidHouseCount;
      return acc;
    },
    {
      houseCount: 0,
      receivableAmount: 0,
      paidAmount: 0,
      outstandingAmount: 0,
      paidHouseCount: 0,
    },
  );

  return {
    ...totals,
    paymentRate: totals.receivableAmount > 0 ? (totals.paidAmount / totals.receivableAmount) * 100 : 0,
    paidHouseRate: totals.houseCount > 0 ? (totals.paidHouseCount / totals.houseCount) * 100 : 0,
  };
});

const displayedBuildingStats = computed<BuildingStatRow[]>(() => [
  ...buildingStats.value,
  {
    buildingId: '__summary__',
    buildingName: '合计',
    houseCount: buildingSummary.value.houseCount,
    receivableAmount: buildingSummary.value.receivableAmount,
    paidAmount: buildingSummary.value.paidAmount,
    outstandingAmount: buildingSummary.value.outstandingAmount,
    paidHouseCount: buildingSummary.value.paidHouseCount,
    paymentRate: buildingSummary.value.paymentRate,
    paidHouseRate: buildingSummary.value.paidHouseRate,
    isSummaryRow: true,
  },
]);

const houseColumns = [
  { colKey: 'displayName', title: '房屋信息', minWidth: 240, ellipsis: true },
  { colKey: 'grossArea', title: '面积', width: 110 },
  { colKey: 'unitPrice', title: '单价', width: 120 },
  { colKey: 'receivableAmount', title: '应收', width: 120 },
  { colKey: 'paidAmount', title: '已收', width: 120 },
  { colKey: 'outstandingAmount', title: '未收', width: 120 },
  { colKey: 'paymentRate', title: '进度', width: 110 },
  { colKey: 'paymentStatus', title: '状态', width: 120 },
  { colKey: 'lastPaidAt', title: '最近缴纳', width: 170 },
  { colKey: 'actions', title: '操作', width: 180, fixed: 'right' },
];

const buildingColumns = [
  { colKey: 'buildingName', title: '楼栋', minWidth: 160 },
  { colKey: 'houseCount', title: '户数', width: 100 },
  { colKey: 'receivableAmount', title: '应收金额', width: 140 },
  { colKey: 'paidAmount', title: '已收金额', width: 140 },
  { colKey: 'outstandingAmount', title: '未收金额', width: 140 },
  { colKey: 'paymentRate', title: '收缴率', width: 110 },
  { colKey: 'paidHouseRate', title: '缴清户占比', width: 120 },
];

function formatCurrency(value: number) {
  return `¥ ${value.toFixed(2)}`;
}

function formatUnitPrice(value: number) {
  return `¥ ${value.toFixed(2)}/㎡`;
}

function formatAreaValue(value: number) {
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

function getMonthEndLabel(dateText?: string | null) {
  const value = dateText ? new Date(dateText) : null;
  if (!value || Number.isNaN(value.getTime())) {
    return '-';
  }

  const month = value.getMonth() + 1;
  const day = value.getDate();
  const monthEnd = new Date(value.getFullYear(), month, 0).getDate();
  return day === monthEnd ? `${month}月底` : `${month}月${day}日`;
}

function formatPeriodRangeLabel(start?: string | null, end?: string | null) {
  const startDate = start ? new Date(start) : null;
  if (!startDate || Number.isNaN(startDate.getTime())) {
    return '-';
  }

  return `${startDate.getFullYear()}年${startDate.getMonth() + 1}月 - ${getMonthEndLabel(end)}`;
}

function clearKeywordSearchTimer() {
  if (!keywordSearchTimer) {
    return;
  }

  clearTimeout(keywordSearchTimer);
  keywordSearchTimer = null;
}

function syncQuickKeyword(value: string) {
  skipQuickKeywordWatch = true;
  quickKeyword.value = value;
  filters.keyword = value.trim();
}

function scheduleKeywordSearch() {
  clearKeywordSearchTimer();
  keywordSearchTimer = setTimeout(() => {
    filters.keyword = quickKeyword.value.trim();
    pagination.page = 1;
    void loadLedger();
  }, 300);
}

async function loadBuildingOptions() {
  if (!periodKey.value) {
    buildingOptions.value = [{ label: '全部楼栋', value: 'ALL' }];
    return;
  }

  const items = await fetchManagementFeeBuildingOptions({ periodKey: periodKey.value });
  buildingOptions.value = [
    { label: '全部楼栋', value: 'ALL' },
    ...items.map((item) => ({
      label: `${item.buildingName} (${item.buildingCode})`,
      value: item.id,
    })),
  ];
}

async function loadSummary() {
  if (!periodKey.value) {
    void router.push('/disclosures/management-fees');
    return;
  }

  summary.value = await fetchManagementFeeSummary({ periodKey: periodKey.value });
}

async function loadBuildingStats() {
  if (!periodKey.value) {
    buildingStats.value = [];
    return;
  }

  const result = await fetchManagementFeeBuildings({ periodKey: periodKey.value });
  buildingStats.value = result.items;
}

async function loadLedger() {
  if (!periodKey.value) {
    return;
  }

  const result = await fetchManagementFeeHouses({
    page: pagination.page,
    pageSize: pagination.pageSize,
    periodKey: periodKey.value,
    keyword: filters.keyword || undefined,
    buildingId: filters.buildingId === 'ALL' ? undefined : filters.buildingId,
    paymentStatus:
      filters.paymentStatus === 'ALL'
        ? undefined
        : (filters.paymentStatus as ManagementFeeHouseRecord['paymentStatus']),
  });

  houseRecords.value = result.items;
  pagination.total = result.total;
}

async function refreshAllData() {
  await Promise.all([loadSummary(), loadBuildingStats(), loadLedger()]);
}

async function initializePage() {
  clearKeywordSearchTimer();
  syncQuickKeyword('');
  filters.buildingId = 'ALL';
  filters.paymentStatus = 'ALL';
  pagination.page = 1;
  activeTab.value = 'building';

  await Promise.all([loadSummary(), loadBuildingOptions(), loadBuildingStats()]);
  await loadLedger();
}

function handleSearch() {
  clearKeywordSearchTimer();
  filters.keyword = quickKeyword.value.trim();
  pagination.page = 1;
  void loadLedger();
}

function resetFilters() {
  clearKeywordSearchTimer();
  syncQuickKeyword('');
  filters.buildingId = 'ALL';
  filters.paymentStatus = 'ALL';
  pagination.page = 1;
  void loadLedger();
}

function handlePageChange(pageInfo: { current: number; pageSize: number }) {
  pagination.page = pageInfo.current;
  pagination.pageSize = pageInfo.pageSize;
  void loadLedger();
}

function openDetail(record: ManagementFeeHouseRecord) {
  currentRecord.value = record;
  detailVisible.value = true;
}

function openStatusDialog(record: ManagementFeeHouseRecord) {
  editingRecord.value = record;
  editingStatus.value = record.paymentStatus;
  statusDialogVisible.value = true;
}

function handleStatusDialogClose() {
  editingRecord.value = null;
  editingStatus.value = 'PENDING';
  statusSubmitting.value = false;
}

async function handleStatusSubmit() {
  if (!editingRecord.value) {
    return;
  }

  statusSubmitting.value = true;
  try {
    await updateManagementFeeStatus(editingRecord.value.id, {
      paymentStatus: editingStatus.value,
    });
    MessagePlugin.success('缴费状态已更新');
    statusDialogVisible.value = false;
    handleStatusDialogClose();
    await refreshAllData();
  } finally {
    statusSubmitting.value = false;
  }
}

watch(
  () => quickKeyword.value,
  () => {
    if (skipQuickKeywordWatch) {
      skipQuickKeywordWatch = false;
      return;
    }

    scheduleKeywordSearch();
  },
);

watch(
  () => periodKey.value,
  () => {
    void initializePage();
  },
);

onBeforeUnmount(() => {
  clearKeywordSearchTimer();
});

onMounted(async () => {
  await initializePage();
});
</script>

<style scoped lang="scss">
:deep(.page-container) {
  min-height: calc(100vh - 148px);
}

:deep(.page-body) {
  flex: 1;
  min-height: 0;
}

.management-fee-ledger-panel {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
}

.management-fee-ledger-panel__body {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
}

.management-fee-ledger-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.management-fee-ledger-actions__search {
  width: 280px;
}

.management-fee-period-meta {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

.management-fee-period-meta__item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px 14px;
  border: 1px solid var(--td-component-border);
  border-radius: 8px;
  background: #fafcff;
}

.management-fee-period-meta__item span {
  font-size: 12px;
  color: #667085;
}

.management-fee-period-meta__item strong {
  font-size: 14px;
  color: #1f2329;
}

.management-fee-ledger-tabs {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;

  :deep(.t-tabs__content) {
    display: flex;
    flex: 1;
    min-height: 0;
    padding-top: 16px;
  }

  :deep(.t-tab-panel) {
    display: flex;
    flex: 1;
    flex-direction: column;
    min-height: 0;
  }
}

.table-pane {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
}

.summary-cell-text {
  font-weight: 600;
  color: #1f2329;
}

.table-pagination {
  flex-shrink: 0;
  margin-top: 16px;
}

.status-dialog-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.status-dialog-summary {
  padding: 12px 14px;
  border: 1px solid var(--td-component-border);
  border-radius: 8px;
  background: #f8fafc;
}

.status-dialog-summary__title {
  font-size: 14px;
  font-weight: 600;
  color: #1f2329;
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

@media (max-width: 960px) {
  .management-fee-period-meta {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  :deep(.page-container) {
    min-height: auto;
  }

  .management-fee-ledger-actions {
    width: 100%;
    flex-wrap: wrap;
    justify-content: flex-end;
  }

  .management-fee-ledger-actions__search {
    width: 100%;
  }

  .management-fee-period-meta,
  .detail-grid {
    grid-template-columns: 1fr;
  }
}
</style>
