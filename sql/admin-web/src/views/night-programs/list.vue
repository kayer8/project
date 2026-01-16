<template>
  <ListPage
    title="Night Programs"
    v-model:keyword="filters.keyword"
    v-model:sort="filters.sort"
    :sort-options="sortOptions"
  >
    <template #actions>
      <t-space>
        <t-button theme="primary" @click="goCreate">New Program</t-button>
        <t-button variant="outline" @click="handleExport">Export</t-button>
      </t-space>
    </template>

    <template #filters>
      <t-select v-model="filters.type" placeholder="Type" clearable :options="nightProgramTypeOptions" />
      <t-select v-model="filters.status" placeholder="Status" clearable :options="statusOptions" />
      <t-select
        v-model="filters.moods"
        placeholder="Moods"
        multiple
        clearable
        :options="moodOptions"
      />
      <t-select
        v-model="filters.directions"
        placeholder="Directions"
        multiple
        clearable
        :options="directionOptions"
      />
      <t-date-range-picker v-model="filters.updatedAt" value-type="YYYY-MM-DD" />
      <t-input-number
        v-model="filters.completionBelow"
        placeholder="Completion <"
        :min="0"
        :max="100"
        :step="5"
        suffix="%"
      />
    </template>

    <template #toolbar-actions>
      <t-space>
        <t-button variant="outline" @click="handleBatchOnline">Batch Online</t-button>
        <t-button variant="outline" @click="handleBatchOffline">Batch Offline</t-button>
      </t-space>
    </template>

    <t-table
      row-key="id"
      :data="pagedItems"
      :columns="columns"
      :hover="true"
      :selected-row-keys="selectedKeys"
      :scroll="{ x: 1500 }"
      @select-change="handleSelectChange"
      @row-click="handleRowClick"
    >
      <template #status="{ row }">
        <t-tag :theme="row.status === 'online' ? 'success' : 'default'" variant="light">
          {{ row.status === 'online' ? 'Online' : 'Offline' }}
        </t-tag>
      </template>
      <template #tags="{ row }">
        <TagSummary :tags="[...row.tags.moods, ...row.tags.directions]" />
      </template>
      <template #duration="{ row }">
        {{ row.duration ? `${row.duration}s` : '-' }}
      </template>
      <template #exposure="{ row }">
        {{ row.performance.range7d.exposure }}
      </template>
      <template #completionRate="{ row }">
        {{ formatRate(row.performance.range7d.completionRate) }}
      </template>
      <template #exitRate="{ row }">
        {{ formatRate(row.performance.range7d.exitRate) }}
      </template>
      <template #operation="{ row }">
        <t-space size="small">
          <t-link theme="primary" @click.stop="goEdit(row)">Edit</t-link>
          <t-link theme="default" @click.stop="handleCopy(row)">Copy</t-link>
          <t-link theme="default" @click.stop="handleToggleStatus(row)">
            {{ row.status === 'online' ? 'Offline' : 'Online' }}
          </t-link>
          <t-link v-if="isSuperAdmin" theme="danger" @click.stop="handleDelete(row)">
            Delete
          </t-link>
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
import { useRoute, useRouter } from 'vue-router';
import { DialogPlugin, MessagePlugin } from 'tdesign-vue-next';
import ListPage from '@/components/ListPage/index.vue';
import TagSummary from '@/components/TagSummary/index.vue';
import { useTableSelection } from '@/hooks/useTableSelection';
import { usePermissions } from '@/hooks/usePermissions';
import {
  statusOptions,
  nightProgramTypeOptions,
  moodOptions,
  directionOptions,
} from '@/modules/common/options';
import { fetchNightPrograms } from '@/modules/night-programs/api';
import type { NightProgram } from '@/modules/night-programs/types';

const router = useRouter();
const route = useRoute();
const { selectedKeys, handleSelectChange, clearSelection } = useTableSelection<string>();
const { isSuperAdmin } = usePermissions();

const items = ref<NightProgram[]>([]);

const filters = reactive({
  keyword: '',
  status: '',
  type: '',
  moods: [] as string[],
  directions: [] as string[],
  updatedAt: [] as string[],
  completionBelow: undefined as number | undefined,
  sort: '',
});

const pagination = reactive({
  current: 1,
  pageSize: 10,
});

const sortOptions = [
  { label: 'Updated (newest)', value: 'updated_desc' },
  { label: 'Completion 7d', value: 'completion_desc' },
  { label: 'Exposure 7d', value: 'exposure_desc' },
];

const columns = [
  { colKey: 'row-select', type: 'multiple', width: 46, fixed: 'left' },
  { colKey: 'id', title: 'Program ID', width: 120 },
  { colKey: 'title', title: 'Title', minWidth: 180 },
  { colKey: 'type', title: 'Type', width: 100 },
  { colKey: 'duration', title: 'Duration', width: 110 },
  { colKey: 'status', title: 'Status', width: 100 },
  { colKey: 'tags', title: 'Tags', width: 180 },
  { colKey: 'updatedAt', title: 'Updated at', width: 150 },
  { colKey: 'updatedBy', title: 'Updated by', width: 120 },
  { colKey: 'exposure', title: 'Exposure 7d', width: 130 },
  { colKey: 'completionRate', title: 'Completion 7d', width: 140 },
  { colKey: 'exitRate', title: 'Exit 7d', width: 120 },
  { colKey: 'operation', title: 'Actions', width: 200, fixed: 'right' },
];

const formatRate = (value: number) => `${Math.round(value * 100)}%`;

const load = async () => {
  items.value = await fetchNightPrograms();
};

const filteredItems = computed(() => {
  const keyword = filters.keyword.trim().toLowerCase();
  const [start, end] = filters.updatedAt;
  const startTime = start ? new Date(start).getTime() : undefined;
  const endTime = end ? new Date(end).getTime() + 24 * 60 * 60 * 1000 : undefined;

  return items.value.filter((item) => {
    if (keyword) {
      const match =
        item.title.toLowerCase().includes(keyword) ||
        item.id.toLowerCase().includes(keyword);
      if (!match) return false;
    }
    if (filters.type && item.type !== filters.type) return false;
    if (filters.status && item.status !== filters.status) return false;
    if (filters.moods.length && !filters.moods.some((tag) => item.tags.moods.includes(tag))) {
      return false;
    }
    if (
      filters.directions.length &&
      !filters.directions.some((tag) => item.tags.directions.includes(tag))
    ) {
      return false;
    }
    if (startTime && endTime) {
      const time = new Date(item.updatedAt).getTime();
      if (time < startTime || time > endTime) return false;
    }
    if (filters.completionBelow != null) {
      if (item.performance.range7d.completionRate * 100 >= filters.completionBelow) {
        return false;
      }
    }
    return true;
  });
});

const sortedItems = computed(() => {
  const list = [...filteredItems.value];
  switch (filters.sort) {
    case 'updated_desc':
      return list.sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      );
    case 'completion_desc':
      return list.sort(
        (a, b) => b.performance.range7d.completionRate - a.performance.range7d.completionRate,
      );
    case 'exposure_desc':
      return list.sort((a, b) => b.performance.range7d.exposure - a.performance.range7d.exposure);
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

const handleRowClick = ({ row }: { row: NightProgram }) => {
  router.push(`/night-programs/${row.id}`);
};

const goCreate = () => {
  router.push('/night-programs/new');
};

const goEdit = (row: NightProgram) => {
  router.push(`/night-programs/${row.id}/edit`);
};

const handleCopy = (row: NightProgram) => {
  DialogPlugin.confirm({
    header: 'Copy program',
    body: `Create a draft copy of "${row.title}"?`,
    onConfirm: () => MessagePlugin.success('Copied to draft (mock).'),
  });
};

const handleToggleStatus = (row: NightProgram) => {
  const next = row.status === 'online' ? 'offline' : 'online';
  DialogPlugin.confirm({
    header: `${next === 'online' ? 'Online' : 'Offline'} program`,
    body: `Confirm to set ${row.title} as ${next}?`,
    onConfirm: () => MessagePlugin.success(`Program set to ${next} (mock).`),
  });
};

const handleDelete = (row: NightProgram) => {
  DialogPlugin.confirm({
    header: 'Delete program',
    body: `Delete ${row.title}?`,
    onConfirm: () => MessagePlugin.success('Program deleted (mock).'),
  });
};

const handleExport = () => {
  MessagePlugin.success('Exported CSV (mock).');
};

const handleBatchOnline = () => {
  if (!selectedKeys.value.length) {
    MessagePlugin.warning('Select programs first.');
    return;
  }
  MessagePlugin.success(`Set ${selectedKeys.value.length} programs online (mock).`);
  clearSelection();
};

const handleBatchOffline = () => {
  if (!selectedKeys.value.length) {
    MessagePlugin.warning('Select programs first.');
    return;
  }
  MessagePlugin.success(`Set ${selectedKeys.value.length} programs offline (mock).`);
  clearSelection();
};

watch(
  () => ({ ...filters }),
  () => {
    pagination.current = 1;
  },
  { deep: true },
);

onMounted(() => {
  const sort = route.query.sort;
  if (typeof sort === 'string') {
    filters.sort = sort;
  }
  void load();
});
</script>
