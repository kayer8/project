<template>
  <PageContainer title="投票列表">
    <template #actions>
      <t-button variant="outline" @click="filterVisible = !filterVisible">
        {{ filterVisible ? '收起筛选' : '筛选' }}
      </t-button>
      <t-button theme="primary">新建投票</t-button>
    </template>

    <section class="admin-panel">
      <div class="admin-panel__header">
        <div>
          <div class="admin-panel__title">投票列表</div>
        </div>
      </div>
      <div class="admin-panel__body">
        <div v-if="filterVisible" class="inline-filter-panel">
          <div class="inline-filter-panel__header">
            <div class="inline-filter-panel__title">筛选查询</div>
          </div>
          <div class="filter-grid">
            <t-input v-model="filters.keyword" clearable placeholder="搜索投票标题 / 发起方" />
            <t-select v-model="filters.type" :options="typeOptions" />
            <t-select v-model="filters.status" :options="statusOptions" />
            <div class="toolbar-actions">
              <t-button theme="primary">查询</t-button>
              <t-button variant="outline" @click="resetFilters">重置</t-button>
            </div>
          </div>
        </div>

        <div class="table-toolbar">
          <div class="table-toolbar__meta">
            <span>共 {{ filteredVotes.length }} 条记录</span>
            <span v-if="selectedRowKeys.length" class="table-selection-count">
              已选 {{ selectedRowKeys.length }} 项
            </span>
          </div>
          <div class="table-toolbar__actions">
            <t-button variant="outline" :disabled="selectedRowKeys.length === 0" @click="batchPublish">
              批量发布
            </t-button>
            <t-button
              variant="outline"
              theme="danger"
              :disabled="selectedRowKeys.length === 0"
              @click="batchClose"
            >
              批量结束
            </t-button>
          </div>
        </div>

        <t-table
          :data="filteredVotes"
          :columns="columns"
          :selected-row-keys="selectedRowKeys"
          :row-selection-type="'multiple'"
          row-key="id"
          size="small"
          bordered
          hover
          @select-change="handleSelectChange"
        >
          <template #titleCell="{ row }">
            <div class="table-primary-cell">
              <div class="table-primary-cell__title">{{ row.title }}</div>
              <div class="table-subtext">{{ row.sponsor }} / {{ row.scope }}</div>
            </div>
          </template>

          <template #status="{ row }">
            <t-tag :theme="statusThemeMap[row.status]" variant="light-outline">{{ row.status }}</t-tag>
          </template>

          <template #actions="{ row }">
            <div class="action-link-group">
              <t-button variant="text" theme="primary" @click="notifyAction('查看', row.title)">查看</t-button>
              <t-button variant="text" theme="danger" @click="notifyAction('结束', row.title)">结束</t-button>
              <t-button variant="text" @click="notifyAction('编辑', row.title)">编辑</t-button>
            </div>
          </template>
        </t-table>
      </div>
    </section>
  </PageContainer>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { MessagePlugin } from 'tdesign-vue-next';
import PageContainer from '@/components/PageContainer/index.vue';
import { voteRecords } from '@/mock/governance';

const filters = reactive({
  keyword: '',
  type: 'ALL',
  status: 'ALL',
});
const selectedRowKeys = ref<Array<string | number>>([]);
const filterVisible = ref(false);

const typeOptions = [
  { label: '全部类型', value: 'ALL' },
  { label: '正式表决', value: '正式表决' },
  { label: '意见征集', value: '意见征集' },
];

const statusOptions = [
  { label: '全部状态', value: 'ALL' },
  { label: '进行中', value: '进行中' },
  { label: '已结束', value: '已结束' },
  { label: '草稿', value: '草稿' },
];

const statusThemeMap = {
  进行中: 'primary',
  已结束: 'success',
  草稿: 'warning',
} as const;

const columns = [
  { colKey: 'row-select', type: 'multiple', width: 48, fixed: 'left' },
  { colKey: 'titleCell', title: '投票标题', minWidth: 280, ellipsis: true },
  { colKey: 'type', title: '类型', width: 120 },
  { colKey: 'status', title: '状态', width: 110 },
  { colKey: 'participantCount', title: '参与人数', width: 110 },
  { colKey: 'participationRate', title: '参与率', width: 100 },
  { colKey: 'deadline', title: '截止时间', width: 160 },
  { colKey: 'actions', title: '操作', width: 180, fixed: 'right' },
];

const filteredVotes = computed(() =>
  voteRecords.filter((item) => {
    const keyword = filters.keyword.trim();
    const matchKeyword =
      !keyword || item.title.includes(keyword) || item.sponsor.includes(keyword);
    const matchType = filters.type === 'ALL' || item.type === filters.type;
    const matchStatus = filters.status === 'ALL' || item.status === filters.status;
    return matchKeyword && matchType && matchStatus;
  }),
);

function handleSelectChange(keys: Array<string | number>) {
  selectedRowKeys.value = keys;
}

function resetFilters() {
  filters.keyword = '';
  filters.type = 'ALL';
  filters.status = 'ALL';
}

function notifyAction(action: string, title: string) {
  MessagePlugin.info(`${action}：${title}`);
}

function batchPublish() {
  MessagePlugin.success(`已触发 ${selectedRowKeys.value.length} 项投票的批量发布`);
}

function batchClose() {
  MessagePlugin.warning(`已触发 ${selectedRowKeys.value.length} 项投票的批量结束`);
}
</script>
