<template>
  <PageContainer title="操作记录">
    <template #actions>
      <div class="page-header__search-actions">
        <t-input
          v-model="quickKeyword"
          class="page-header__search-input"
          clearable
          placeholder="快速搜索资源名称、资源ID或操作人"
        />
        <t-button variant="outline" @click="filterVisible = !filterVisible">
          {{ filterVisible ? '收起筛选' : '筛选' }}
        </t-button>
      </div>
    </template>

    <section class="admin-panel">
      <div class="admin-panel__header">
        <div>
          <div class="admin-panel__title">操作留痕</div>
        </div>
      </div>
      <div class="admin-panel__body">
        <div v-if="filterVisible" class="inline-filter-panel">
          <div class="inline-filter-panel__header">
            <div class="inline-filter-panel__title">筛选条件</div>
          </div>
          <div class="filter-grid operation-log-filter-grid">
            <t-select v-model="filters.resourceType" :options="operationResourceTypeOptions" />
            <t-select v-model="filters.action" :options="operationActionOptions" />
            <div class="toolbar-actions">
              <t-button theme="primary" @click="handleSearch">查询</t-button>
              <t-button variant="outline" @click="resetFilters">重置</t-button>
            </div>
          </div>
        </div>

        <div class="table-toolbar">
          <div class="table-toolbar__meta">
            <span>共 {{ pagination.total }} 条记录</span>
          </div>
        </div>

        <t-table :data="records" :columns="columns" row-key="id" size="small" bordered hover>
          <template #resourceNameCell="{ row }">
            <div class="table-primary-cell">
              <div class="table-primary-cell__title">{{ row.resourceName || row.resourceId }}</div>
              <div class="table-subtext">{{ row.resourceId }}</div>
            </div>
          </template>

          <template #resourceType="{ row }">
            {{ operationResourceTypeLabelMap[row.resourceType] || row.resourceType }}
          </template>

          <template #action="{ row }">
            <t-tag :theme="operationActionThemeMap[row.action] || 'primary'" variant="light-outline">
              {{ operationActionLabelMap[row.action] || row.action }}
            </t-tag>
          </template>

          <template #createdAt="{ row }">
            {{ formatDateTime(row.createdAt) }}
          </template>

          <template #actions="{ row }">
            <t-button variant="text" theme="primary" @click="openDetail(row)">查看详情</t-button>
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

    <t-dialog v-model:visible="detailVisible" header="操作详情" width="760px" :footer="false">
      <div v-if="activeRecord" class="operation-log-detail">
        <div class="operation-log-detail__meta">
          <div><span>资源</span><strong>{{ activeRecord.resourceName || activeRecord.resourceId }}</strong></div>
          <div><span>模块</span><strong>{{ operationResourceTypeLabelMap[activeRecord.resourceType] || activeRecord.resourceType }}</strong></div>
          <div><span>动作</span><strong>{{ operationActionLabelMap[activeRecord.action] || activeRecord.action }}</strong></div>
          <div><span>操作人</span><strong>{{ activeRecord.actorLabel }}</strong></div>
          <div><span>IP</span><strong>{{ formatText(activeRecord.ip) }}</strong></div>
          <div><span>时间</span><strong>{{ formatDateTime(activeRecord.createdAt) }}</strong></div>
        </div>
        <pre class="operation-log-detail__snapshot">{{ formatSnapshot(activeRecord.snapshotJson) }}</pre>
      </div>
    </t-dialog>
  </PageContainer>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import PageContainer from '@/components/PageContainer/index.vue';
import { useQuickKeywordSearch } from '@/composables/useQuickKeywordSearch';
import { fetchOperationLogList } from '@/modules/operation-log/api';
import type { OperationLogItem } from '@/modules/operation-log/types';
import {
  operationActionLabelMap,
  operationActionOptions,
  operationActionThemeMap,
  operationResourceTypeLabelMap,
  operationResourceTypeOptions,
} from '@/modules/operation-log/types';
import { formatDateTime, formatText } from '@/utils/format';

const records = ref<OperationLogItem[]>([]);
const filterVisible = ref(false);
const detailVisible = ref(false);
const activeRecord = ref<OperationLogItem | null>(null);
const filters = reactive({
  keyword: '',
  resourceType: 'ALL',
  action: 'ALL',
});
const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0,
});

const columns = [
  { colKey: 'resourceNameCell', title: '操作对象', minWidth: 280, ellipsis: true },
  { colKey: 'resourceType', title: '模块', width: 140 },
  { colKey: 'action', title: '动作', width: 120 },
  { colKey: 'actorLabel', title: '操作人', width: 180 },
  { colKey: 'ip', title: 'IP', width: 140 },
  { colKey: 'createdAt', title: '操作时间', width: 180 },
  { colKey: 'actions', title: '操作', width: 120, fixed: 'right' },
];

const { quickKeyword, setQuickKeyword, commitQuickKeyword, clearQuickKeywordTimer } = useQuickKeywordSearch(
  (keyword) => {
    filters.keyword = keyword;
    pagination.page = 1;
    void loadList();
  },
);

async function loadList() {
  const result = await fetchOperationLogList({
    page: pagination.page,
    pageSize: pagination.pageSize,
    keyword: filters.keyword.trim() || undefined,
    resourceType:
      filters.resourceType === 'ALL' ? undefined : (filters.resourceType as 'DISCLOSURE_CONTENT' | 'MANAGEMENT_FEE_PERIOD' | 'MANAGEMENT_FEE_RECORD'),
    action:
      filters.action === 'ALL' ? undefined : (filters.action as 'CREATE' | 'UPDATE' | 'PUBLISH' | 'DELETE' | 'STATUS_UPDATE'),
  });

  records.value = result.items;
  pagination.total = result.total;
}

function handleSearch() {
  commitQuickKeyword();
}

function resetFilters() {
  clearQuickKeywordTimer();
  setQuickKeyword('');
  filters.keyword = '';
  filters.resourceType = 'ALL';
  filters.action = 'ALL';
  pagination.page = 1;
  void loadList();
}

function handlePageChange(pageInfo: { current: number; pageSize: number }) {
  pagination.page = pageInfo.current;
  pagination.pageSize = pageInfo.pageSize;
  void loadList();
}

function openDetail(record: OperationLogItem) {
  activeRecord.value = record;
  detailVisible.value = true;
}

function formatSnapshot(snapshotJson: Record<string, unknown> | null) {
  if (!snapshotJson) {
    return '无附加快照';
  }

  return JSON.stringify(snapshotJson, null, 2);
}

onMounted(() => {
  void loadList();
});
</script>

<style scoped>
.operation-log-filter-grid {
  grid-template-columns: minmax(180px, 220px) minmax(180px, 220px) auto;
}

.operation-log-detail {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.operation-log-detail__meta {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px 16px;
}

.operation-log-detail__meta span {
  display: block;
  margin-bottom: 4px;
  font-size: 12px;
  color: #708198;
}

.operation-log-detail__meta strong {
  font-size: 14px;
  color: #18223a;
  word-break: break-all;
}

.operation-log-detail__snapshot {
  margin: 0;
  padding: 14px 16px;
  overflow: auto;
  border-radius: 10px;
  background: #0f172a;
  color: #e2e8f0;
  font-size: 12px;
  line-height: 1.6;
}

@media (max-width: 1280px) {
  .operation-log-filter-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .operation-log-filter-grid,
  .operation-log-detail__meta {
    grid-template-columns: 1fr;
  }
}
</style>
