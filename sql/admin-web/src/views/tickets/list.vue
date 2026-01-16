<template>
  <ListPage
    title="Tickets"
    v-model:keyword="filters.keyword"
    v-model:sort="filters.sort"
    :sort-options="sortOptions"
  >
    <template #actions>
      <t-space>
        <t-button variant="outline" @click="handleExport">Export</t-button>
      </t-space>
    </template>

    <template #filters>
      <t-select v-model="filters.status" placeholder="Status" clearable :options="ticketStatusOptions" />
      <t-select v-model="filters.type" placeholder="Type" clearable :options="ticketTypeOptions" />
      <t-select
        v-model="filters.tags"
        placeholder="Tags"
        multiple
        clearable
        :options="tagOptions"
      />
      <t-select
        v-model="filters.unassigned"
        placeholder="Unassigned"
        clearable
        :options="[
          { label: 'Yes', value: true },
          { label: 'No', value: false },
        ]"
      />
      <t-date-range-picker v-model="filters.createdAt" value-type="YYYY-MM-DD" />
    </template>

    <template #toolbar-actions>
      <t-space>
        <t-button variant="outline" @click="handleBatchAssign">Batch Assign</t-button>
        <t-button variant="outline" @click="handleBatchClose">Batch Close</t-button>
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
        <TagSummary :tags="row.tags" />
      </template>
      <template #operation="{ row }">
        <t-space size="small">
          <t-link theme="primary" @click.stop="handleView(row)">View</t-link>
          <t-link theme="default" @click.stop="handleAssign(row)">Assign</t-link>
          <t-link theme="default" @click.stop="handleAdvanceStatus(row)">Advance</t-link>
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
import { ticketTypeOptions, ticketStatusOptions } from '@/modules/common/options';
import { fetchTickets } from '@/modules/tickets/api';
import type { Ticket, TicketStatus } from '@/modules/tickets/types';

const router = useRouter();
const { selectedKeys, handleSelectChange, clearSelection } = useTableSelection<string>();

const items = ref<Ticket[]>([]);

const tagOptions = [
  { label: 'UI', value: 'ui' },
  { label: 'Task', value: 'task' },
  { label: 'Night', value: 'night' },
  { label: 'Push', value: 'push' },
  { label: 'Performance', value: 'performance' },
];

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
  { label: 'Created (newest)', value: 'created_desc' },
  { label: 'Status', value: 'status' },
];

const columns = [
  { colKey: 'row-select', type: 'multiple', width: 46, fixed: 'left' },
  { colKey: 'id', title: 'Ticket ID', width: 120 },
  { colKey: 'type', title: 'Type', width: 120 },
  { colKey: 'status', title: 'Status', width: 120 },
  { colKey: 'summary', title: 'Summary', minWidth: 220 },
  { colKey: 'user', title: 'User', width: 120, cell: ({ row }: { row: Ticket }) => row.user.id },
  { colKey: 'createdAt', title: 'Created at', width: 150 },
  { colKey: 'assignee', title: 'Assignee', width: 120 },
  { colKey: 'tags', title: 'Tags', width: 180 },
  { colKey: 'operation', title: 'Actions', width: 180, fixed: 'right' },
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
  MessagePlugin.info('Assign flow opened (mock).');
};

const handleAdvanceStatus = () => {
  MessagePlugin.success('Status advanced (mock).');
};

const handleBatchAssign = () => {
  if (!selectedKeys.value.length) {
    MessagePlugin.warning('Select tickets first.');
    return;
  }
  MessagePlugin.success(`Assigned ${selectedKeys.value.length} tickets (mock).`);
  clearSelection();
};

const handleBatchClose = () => {
  if (!selectedKeys.value.length) {
    MessagePlugin.warning('Select tickets first.');
    return;
  }
  MessagePlugin.success(`Closed ${selectedKeys.value.length} tickets (mock).`);
  clearSelection();
};

const handleExport = () => {
  MessagePlugin.success('Exported CSV (mock).');
};

const formatStatus = (status: TicketStatus) => {
  switch (status) {
    case 'new':
      return 'New';
    case 'in_progress':
      return 'In Progress';
    case 'resolved':
      return 'Resolved';
    case 'closed':
      return 'Closed';
    default:
      return status;
  }
};

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
