<template>
  <ListPage
    title="反馈工单"
    v-model:keyword="filters.keyword"
    v-model:sort="filters.sort"
    :sort-options="sortOptions"
  >
    <template #actions>
      <t-space>
        <t-button variant="outline" @click="handleExport">导出</t-button>
      </t-space>
    </template>

    <template #filters>
      <t-select v-model="filters.status" placeholder="状态" clearable :options="ticketStatusOptions" />
      <t-select v-model="filters.type" placeholder="类型" clearable :options="ticketTypeOptions" />
      <t-select
        v-model="filters.tags"
        placeholder="标签"
        multiple
        clearable
        :options="tagOptions"
      />
      <t-select
        v-model="filters.unassigned"
        placeholder="未分配"
        clearable
        :options="[
          { label: '是', value: true },
          { label: '否', value: false },
        ]"
      />
      <t-date-range-picker v-model="filters.createdAt" value-type="YYYY-MM-DD" />
    </template>

    <template #toolbar-actions>
      <t-space>
        <t-button variant="outline" @click="handleBatchAssign">批量分配</t-button>
        <t-button variant="outline" @click="handleBatchClose">批量关闭</t-button>
      </t-space>
    </template>

    <t-table
      row-key="id"
      :data="pagedItems"
      :columns="columns"
      :hover="true"
      :selected-row-keys="selectedKeys"
      :scroll="{ x: 1400 }"
      @select-change="handleSelectChange"
      @row-click="handleRowClick"
    >
      <template #status="{ row }">
        <t-tag :theme="statusTheme(row.status)" variant="light">
          {{ formatStatus(row.status) }}
        </t-tag>
      </template>
      <template #tags="{ row }">
        <TagSummary :tags="formatTags(row.tags)" />
      </template>
      <template #operation="{ row }">
        <t-space size="small">
          <t-link theme="primary" @click.stop="handleView(row)">查看</t-link>
          <t-link theme="default" @click.stop="handleAssign(row)">分配</t-link>
          <t-link theme="default" @click.stop="handleAdvanceStatus(row)">变更状态</t-link>
        </t-space>
      </template>
    </t-table>

    <template #pagination>
      <t-pagination
        :current="pagination.current"
        :page-size="pagination.pageSize"
        :total="sortedItems.length"
        :show-page-size="true"
        :page-size-options="[10, 20, 50]"
        @change="handlePageChange"
      />
    </template>
  </ListPage>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { MessagePlugin } from 'tdesign-vue-next';
import ListPage from '@/components/ListPage/index.vue';
import TagSummary from '@/components/TagSummary/index.vue';
import { useTableSelection } from '@/hooks/useTableSelection';
import { ticketTypeOptions, ticketStatusOptions, getOptionLabel } from '@/modules/common/options';
import { fetchTickets } from '@/modules/tickets/api';
import type { Ticket, TicketStatus } from '@/modules/tickets/types';

const router = useRouter();
const { selectedKeys, handleSelectChange, clearSelection } = useTableSelection<string>();

const items = ref<Ticket[]>([]);

const tagOptions = [
  { label: '界面', value: 'ui' },
  { label: '任务', value: 'task' },
  { label: '夜间', value: 'night' },
  { label: '推送', value: 'push' },
  { label: '性能', value: 'performance' },
];

const tagLabelMap = new Map(tagOptions.map((item) => [item.value, item.label]));

const filters = reactive({
  keyword: '',
  status: '',
  type: '',
  tags: [] as string[],
  unassigned: undefined as boolean | undefined,
  createdAt: [] as string[],
  sort: '',
});

const pagination = reactive({
  current: 1,
  pageSize: 10,
});

const sortOptions = [
  { label: '创建时间（新到旧）', value: 'created_desc' },
  { label: '状态', value: 'status' },
];

const columns = [
  { colKey: 'row-select', type: 'multiple', width: 46, fixed: 'left' },
  { colKey: 'id', title: '工单ID', width: 120 },
  {
    colKey: 'type',
    title: '类型',
    width: 120,
    cell: ({ row }: { row: Ticket }) => getOptionLabel(ticketTypeOptions, row.type),
  },
  { colKey: 'status', title: '状态', width: 120 },
  { colKey: 'summary', title: '内容摘要', minWidth: 220 },
  { colKey: 'user', title: '用户', width: 120, cell: ({ row }: { row: Ticket }) => row.user.id },
  { colKey: 'createdAt', title: '创建时间', width: 150 },
  { colKey: 'assignee', title: '负责人', width: 120 },
  { colKey: 'tags', title: '标签', width: 180 },
  { colKey: 'operation', title: '操作', width: 180, fixed: 'right' },
];

const load = async () => {
  items.value = await fetchTickets();
};

const filteredItems = computed(() => {
  const keyword = filters.keyword.trim().toLowerCase();
  const [start, end] = filters.createdAt;
  const startTime = start ? new Date(start).getTime() : undefined;
  const endTime = end ? new Date(end).getTime() + 24 * 60 * 60 * 1000 : undefined;

  return items.value.filter((item) => {
    if (keyword) {
      const match =
        item.summary.toLowerCase().includes(keyword) ||
        item.id.toLowerCase().includes(keyword);
      if (!match) return false;
    }
    if (filters.status && item.status !== filters.status) return false;
    if (filters.type && item.type !== filters.type) return false;
    if (filters.tags.length && !filters.tags.some((tag) => item.tags.includes(tag))) {
      return false;
    }
    if (filters.unassigned !== undefined) {
      const isUnassigned = !item.assignee;
      if (filters.unassigned !== isUnassigned) return false;
    }
    if (startTime && endTime) {
      const time = new Date(item.createdAt).getTime();
      if (time < startTime || time > endTime) return false;
    }
    return true;
  });
});

const sortedItems = computed(() => {
  const list = [...filteredItems.value];
  switch (filters.sort) {
    case 'created_desc':
      return list.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
    case 'status':
      return list.sort((a, b) => a.status.localeCompare(b.status));
    default:
      return list;
  }
});

const pagedItems = computed(() => {
  const start = (pagination.current - 1) * pagination.pageSize;
  return sortedItems.value.slice(start, start + pagination.pageSize);
});

const handlePageChange = (pageInfo: { current: number; pageSize: number }) => {
  pagination.current = pageInfo.current;
  pagination.pageSize = pageInfo.pageSize;
};

const handleRowClick = ({ row }: { row: Ticket }) => {
  router.push(`/tickets/${row.id}`);
};

const handleView = (row: Ticket) => {
  router.push(`/tickets/${row.id}`);
};

const handleAssign = () => {
  MessagePlugin.info('已打开分配流程（模拟）。');
};

const handleAdvanceStatus = () => {
  MessagePlugin.success('状态已变更（模拟）。');
};

const handleBatchAssign = () => {
  if (!selectedKeys.value.length) {
    MessagePlugin.warning('请先选择工单。');
    return;
  }
  MessagePlugin.success(`已分配 ${selectedKeys.value.length} 个工单（模拟）。`);
  clearSelection();
};

const handleBatchClose = () => {
  if (!selectedKeys.value.length) {
    MessagePlugin.warning('请先选择工单。');
    return;
  }
  MessagePlugin.success(`已关闭 ${selectedKeys.value.length} 个工单（模拟）。`);
  clearSelection();
};

const handleExport = () => {
  MessagePlugin.success('已导出 CSV（模拟）。');
};

const formatStatus = (status: TicketStatus) => getOptionLabel(ticketStatusOptions, status);

const formatTags = (tags: string[]) => tags.map((tag) => tagLabelMap.get(tag) || tag);

const statusTheme = (status: TicketStatus) => {
  switch (status) {
    case 'new':
      return 'warning';
    case 'in_progress':
      return 'primary';
    case 'resolved':
      return 'success';
    case 'closed':
      return 'default';
    default:
      return 'default';
  }
};

watch(
  () => ({ ...filters }),
  () => {
    pagination.current = 1;
  },
  { deep: true },
);

onMounted(() => {
  void load();
});
</script>

