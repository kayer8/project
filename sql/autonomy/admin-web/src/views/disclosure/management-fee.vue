<template>
  <PageContainer title="管理费公开">
    <template #actions>
      <t-button theme="primary" @click="dialogVisible = true">新增时段</t-button>
      <t-button variant="outline" @click="handleRefresh">刷新统计</t-button>
    </template>

    <section class="admin-panel">
      <div class="admin-panel__header">
        <div>
          <div class="admin-panel__title">管理时段</div>
        </div>
      </div>
      <div class="admin-panel__body">
        <t-table :data="periods" :columns="periodColumns" row-key="periodKey" size="small" bordered hover>
          <template #periodRange="{ row }">
            <t-button variant="text" theme="primary" class="period-link" @click="openPeriodLedger(row)">
              {{ formatPeriodRangeLabel(row.chargeStartDate, row.chargeEndDate) }}
            </t-button>
            <div class="table-subtext">
              {{ formatDate(row.chargeStartDate) }} 至 {{ formatDate(row.chargeEndDate) }}
            </div>
          </template>

          <template #dueDate="{ row }">
            {{ formatDate(row.dueDate) }}
          </template>

          <template #pricingRule="{ row }">
            <div class="table-primary-cell">
              <div class="table-primary-cell__title">{{ formatPricingRule(row) }}</div>
              <div class="table-subtext">统一单价</div>
            </div>
          </template>

          <template #actions="{ row }">
            <div class="action-link-group">
              <t-button variant="text" theme="primary" @click="openPeriodLedger(row)">
                进入账本
              </t-button>
            </div>
          </template>
        </t-table>
      </div>
    </section>

    <t-dialog
      v-model:visible="dialogVisible"
      header="新增管理时段"
      width="640px"
      :confirm-loading="submitting"
      confirm-btn="创建时段"
      @confirm="handleCreatePeriod"
      @close="resetForm"
    >
      <div class="form-grid">
        <div class="field">
          <div class="field-label required">管理开始日期</div>
          <t-date-picker
            v-model="periodForm.chargeStartDate"
            clearable
            format="YYYY-MM-DD"
            value-type="YYYY-MM-DD"
            placeholder="请选择开始日期"
          />
        </div>
        <div class="field">
          <div class="field-label required">管理结束日期</div>
          <t-date-picker
            v-model="periodForm.chargeEndDate"
            clearable
            format="YYYY-MM-DD"
            value-type="YYYY-MM-DD"
            placeholder="请选择结束日期"
          />
        </div>
        <div class="field field--full">
          <div class="field-label required">截止日期</div>
          <t-date-picker
            v-model="periodForm.dueDate"
            clearable
            format="YYYY-MM-DD"
            value-type="YYYY-MM-DD"
            placeholder="请选择截止日期"
          />
        </div>
        <div class="field">
          <div class="field-label required">每平米单价</div>
          <t-input-number v-model="periodForm.unitPrice" theme="normal" placeholder="请输入单价" />
        </div>
        <div class="field">
          <div class="field-label">固定费用</div>
          <t-input-number v-model="periodForm.baseAmount" theme="normal" placeholder="默认 0" />
        </div>
      </div>
      <div class="pricing-rule-note">
        <div class="pricing-rule-note__title">收费规则说明</div>
        <div class="pricing-rule-note__text">每户应缴费用 = 建筑面积 × 每平米单价 + 固定费用。</div>
        <div class="pricing-rule-note__text">
          当前按房屋建筑面积统一计算，若固定费用不收取，请保持为 0。
        </div>
        <div class="pricing-rule-note__example">
          例如：建筑面积 100㎡，每平米单价 2.68 元，固定费用 0 元，则该户应缴 268 元。
        </div>
        <div class="pricing-rule-note__example">
          例如：建筑面积 100㎡，每平米单价 2.68 元，固定费用 20 元，则该户应缴 288 元。
        </div>
      </div>
    </t-dialog>
  </PageContainer>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { MessagePlugin } from 'tdesign-vue-next';
import { useRouter } from 'vue-router';
import PageContainer from '@/components/PageContainer/index.vue';
import { formatDate } from '@/utils/format';
import { createManagementFeePeriod, fetchManagementFeePeriods } from '@/modules/management-fee/api';
import type { ManagementFeePeriodItem } from '@/modules/management-fee/types';

const router = useRouter();
const periods = ref<ManagementFeePeriodItem[]>([]);
const dialogVisible = ref(false);
const submitting = ref(false);
const periodForm = reactive({
  chargeStartDate: '',
  chargeEndDate: '',
  dueDate: '',
  unitPrice: 2.68,
  baseAmount: 0,
});

const periodColumns = [
  { colKey: 'periodRange', title: '管理时段', minWidth: 280 },
  { colKey: 'pricingRule', title: '收费标准', minWidth: 220 },
  { colKey: 'houseCount', title: '房屋数', width: 100 },
  { colKey: 'paidHouseholds', title: '已缴清', width: 100 },
  { colKey: 'unpaidHouseholds', title: '未缴纳', width: 100 },
  { colKey: 'dueDate', title: '截止日期', width: 140 },
  { colKey: 'actions', title: '操作', width: 120, fixed: 'right' },
];

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

function formatPricingRule(period: ManagementFeePeriodItem) {
  return `¥ ${Number(period.unitPrice ?? 0).toFixed(2)}/㎡ + 固定 ¥ ${Number(period.baseAmount ?? 0).toFixed(2)}`;
}

async function loadPeriodList() {
  periods.value = await fetchManagementFeePeriods();
}

function openPeriodLedger(period: ManagementFeePeriodItem) {
  void router.push({
    name: 'AutonomyDisclosureManagementFeeLedger',
    params: { periodKey: period.periodKey },
  });
}

async function handleRefresh() {
  await loadPeriodList();
}

function resetForm() {
  periodForm.chargeStartDate = '';
  periodForm.chargeEndDate = '';
  periodForm.dueDate = '';
  periodForm.unitPrice = 2.68;
  periodForm.baseAmount = 0;
  submitting.value = false;
}

async function handleCreatePeriod() {
  if (!periodForm.chargeStartDate) {
    MessagePlugin.warning('请选择管理开始日期');
    return;
  }

  if (!periodForm.chargeEndDate) {
    MessagePlugin.warning('请选择管理结束日期');
    return;
  }

  if (!periodForm.dueDate) {
    MessagePlugin.warning('请选择截止日期');
    return;
  }

  if (periodForm.unitPrice === undefined || periodForm.unitPrice === null) {
    MessagePlugin.warning('请输入每平米单价');
    return;
  }

  submitting.value = true;
  try {
    await createManagementFeePeriod({
      chargeStartDate: periodForm.chargeStartDate,
      chargeEndDate: periodForm.chargeEndDate,
      dueDate: periodForm.dueDate,
      unitPrice: Number(periodForm.unitPrice),
      baseAmount: Number(periodForm.baseAmount || 0),
    });
    MessagePlugin.success('管理时段创建成功');
    dialogVisible.value = false;
    resetForm();
    await loadPeriodList();
  } finally {
    submitting.value = false;
  }
}

onMounted(async () => {
  await loadPeriodList();
});
</script>

<style scoped lang="scss">
.period-link {
  padding: 0;
  font-size: 14px;
  font-weight: 600;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.field--full {
  grid-column: 1 / -1;
}

.field-label {
  font-size: 14px;
  font-weight: 600;
  color: #334155;
}

.field-label.required::after {
  content: ' *';
  color: #d54941;
}

.pricing-rule-note {
  margin-top: 16px;
  padding: 14px 16px;
  border: 1px solid #dbe4f0;
  border-radius: 10px;
  background: #f8fbff;
}

.pricing-rule-note__title {
  margin-bottom: 8px;
  font-size: 13px;
  font-weight: 700;
  color: #1e3a5f;
}

.pricing-rule-note__text {
  font-size: 13px;
  line-height: 1.7;
  color: #526079;
}

.pricing-rule-note__example {
  font-size: 13px;
  line-height: 1.7;
  font-weight: 600;
  color: #1e3a5f;
}

@media (max-width: 768px) {
  .form-grid {
    grid-template-columns: 1fr;
  }

  .field--full {
    grid-column: auto;
  }
}
</style>
