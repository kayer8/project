<template>
  <ListPage
    title="Task Templates"
    v-model:keyword="filters.keyword"
    v-model:sort="filters.sort"
    :sort-options="sortOptions"
  >
    <template #actions>
      <t-space>
        <t-button theme="primary" @click="goCreate">New Task</t-button>
        <t-button variant="outline" @click="handleImport">Import</t-button>
        <t-button variant="outline" @click="handleExport">Export</t-button>
      </t-space>
    </template>

    <template #filters>
      <t-select v-model="filters.status" placeholder="Status" clearable :options="statusOptions" />
      <t-select v-model="filters.type" placeholder="Type" clearable :options="taskTypeOptions" />
      <t-select v-model="filters.difficulty" placeholder="Difficulty" clearable :options="difficultyOptions" />
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
      <t-select
        v-model="filters.traces"
        placeholder="Traces"
        multiple
        clearable
        :options="traceOptions"
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
        <t-button variant="outline" @click="handleBatchTag">Batch Tag</t-button>
      </t-space>
    </template>

    <t-table
      row-key="id"
      :data="pagedItems"
      :columns="columns"
      :hover="true"
      :selected-row-keys="selectedKeys"
      :scroll="{ x: 1800 }"
      @select-change="handleSelectChange"
      @row-click="handleRowClick"
    >
      <template #status="{ row }">
        <t-tag :theme="row.status === 'online' ? 'success' : 'default'" variant="light">
          {{ row.status === 'online' ? 'Online' : 'Offline' }}
        </t-tag>
      </template>
      <template #type="{ row }">
        {{ row.type }}
      </template>
      <template #tagSummary="{ row }">
        <TagSummary :tags="getTagSummary(row)" />
      </template>
      <template #moods="{ row }">
        <TagSummary :tags="row.tags.moods" />
      </template>
      <template #directions="{ row }">
        <TagSummary :tags="row.tags.directions" />
      </template>
      <template #traces="{ row }">
        <TagSummary :tags="row.tags.traces" />
      </template>
      <template #defaultDuration="{ row }">
        {{ row.type === 'timer' ? `${row.defaultDuration}s` : '-' }}
      </template>
      <template #exposure="{ row }">
        {{ row.performance.range7d.exposure }}
      </template>
      <template #completionRate="{ row }">
        {{ formatRate(row.performance.range7d.completionRate) }}
      </template>
      <template #skipRate="{ row }">
        {{ formatRate(row.performance.range7d.skipRate) }}
      </template>
      <template #replaceRate="{ row }">
        {{ formatRate(row.performance.range7d.replaceRate) }}
      </template>
      <template #operation="{ row }">
        <t-space size="small">
          <t-link theme="primary" @click.stop="goEdit(row)">Edit</t-link>
          <t-link theme="default" @click.stop="handleCopy(row)">Copy</t-link>
          <t-link theme="default" @click.stop="handleToggleStatus(row)">
            {{ row.status === 'online' ? 'Offline' : 'Online' }}
          </t-link>
          <t-link
            v-if="isSuperAdmin"
            theme="danger"
            @click.stop="openDeleteDialog(row)"
          >
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

  <t-dialog
    v-model:visible="deleteDialogVisible"
    header="Delete template"
    :confirm-btn="{ content: 'Delete', disabled: deleteConfirmText !== 'DELETE' }"
    cancel-btn="Cancel"
    @confirm="confirmDelete"
  >
    <div class="delete-dialog">
      <p>Type DELETE to confirm removing this template.</p>
      <t-input v-model="deleteConfirmText" placeholder="Type DELETE" />
    </div>
  </t-dialog>
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
  taskTypeOptions,
  difficultyOptions,
  moodOptions,
  directionOptions,
  traceOptions,
} from '@/modules/common/options';
import { fetchTaskTemplates } from '@/modules/task-templates/api';
import type { TaskTemplate } from '@/modules/task-templates/types';

const router = useRouter();
const route = useRoute();
const { selectedKeys, handleSelectChange, clearSelection } = useTableSelection<string>();
const { isSuperAdmin } = usePermissions();

const items = ref<TaskTemplate[]>([]);

const filters = reactive({
  keyword: '',
  status: '',
  type: '',
  difficulty: undefined as number | undefined,
  moods: [] as string[],
  directions: [] as string[],
  traces: [] as string[],
  updatedAt: [] as string[],
  completionBelow: undefined as number | undefined,
  sort: '',
});

const pagination = reactive({
  current: 1,
  pageSize: 10,
});

const sortOptions = [
  { label: 'Created (newest)', value: 'created_desc' },
  { label: 'Updated (newest)', value: 'updated_desc' },
  { label: 'Completion 7d', value: 'completion_desc' },
  { label: 'Exposure 7d', value: 'exposure_desc' },
];

const columns = [
  { colKey: 'row-select', type: 'multiple', width: 46, fixed: 'left' },
  { colKey: 'id', title: 'Template ID', width: 120 },
  { colKey: 'title', title: 'Title', minWidth: 180 },
  { colKey: 'type', title: 'Type', width: 90 },
  { colKey: 'difficulty', title: 'Difficulty', width: 100 },
  { colKey: 'status', title: 'Status', width: 100 },
  { colKey: 'tagSummary', title: 'Tag summary', width: 160 },
  { colKey: 'moods', title: 'Moods', width: 150 },
  { colKey: 'directions', title: 'Directions', width: 160 },
  { colKey: 'traces', title: 'Traces', width: 160 },
  { colKey: 'defaultDuration', title: 'Default duration', width: 150 },
  { colKey: 'updatedAt', title: 'Updated at', width: 150 },
  { colKey: 'updatedBy', title: 'Updated by', width: 120 },
  { colKey: 'exposure', title: 'Exposure 7d', width: 130 },
  { colKey: 'completionRate', title: 'Completion 7d', width: 140 },
  { colKey: 'skipRate', title: 'Skip 7d', width: 120 },
  { colKey: 'replaceRate', title: 'Replace 7d', width: 120 },
  { colKey: 'operation', title: 'Actions', width: 200, fixed: 'right' },
];

const getTagSummary = (row: TaskTemplate) => [
  ...row.tags.moods,
  ...row.tags.directions,
  ...row.tags.traces,
];

const formatRate = (value: number) => `${Math.round(value * 100)}%`;

const load = async () => {
  items.value = await fetchTaskTemplates();
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
    if (filters.status && item.status !== filters.status) return false;
    if (filters.type && item.type !== filters.type) return false;
    if (filters.difficulty && item.difficulty !== filters.difficulty) return false;
    if (filters.moods.length && !filters.moods.some((tag) => item.tags.moods.includes(tag))) {
      return false;
    }
    if (
      filters.directions.length &&
      !filters.directions.some((tag) => item.tags.directions.includes(tag))
    ) {
      return false;
    }
    if (filters.traces.length && !filters.traces.some((tag) => item.tags.traces.includes(tag))) {
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
    case 'created_desc':
      return list.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
    case 'updated_desc':
      return list.sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      );
    case 'completion_desc':
      return list.sort(
        (a, b) =>
          b.performance.range7d.completionRate - a.performance.range7d.completionRate,
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

const handleRowClick = ({ row }: { row: TaskTemplate }) => {
  router.push(`/task-templates/${row.id}`);
};

const goCreate = () => {
  router.push('/task-templates/new');
};

const goEdit = (row: TaskTemplate) => {
  router.push(`/task-templates/${row.id}/edit`);
};

const handleCopy = (row: TaskTemplate) => {
  DialogPlugin.confirm({
    header: 'Copy template',
    body: `Create a draft copy of "${row.title}"?`,
    onConfirm: () => MessagePlugin.success('Copied to draft (mock).'),
  });
};

const handleToggleStatus = (row: TaskTemplate) => {
  const next = row.status === 'online' ? 'offline' : 'online';
  DialogPlugin.confirm({
    header: `${next === 'online' ? 'Online' : 'Offline'} template`,
    body: `Confirm to set ${row.title} as ${next}?`,
    onConfirm: () => MessagePlugin.success(`Template set to ${next} (mock).`),
  });
};

const handleImport = () => {
  MessagePlugin.info('Import preview opened (mock).');
};

const handleExport = () => {
  MessagePlugin.success('Exported CSV (mock).');
};

const handleBatchOnline = () => {
  if (!selectedKeys.value.length) {
    MessagePlugin.warning('Select templates first.');
    return;
  }
  MessagePlugin.success(`Set ${selectedKeys.value.length} templates online (mock).`);
  clearSelection();
};

const handleBatchOffline = () => {
  if (!selectedKeys.value.length) {
    MessagePlugin.warning('Select templates first.');
    return;
  }
  MessagePlugin.success(`Set ${selectedKeys.value.length} templates offline (mock).`);
  clearSelection();
};

const handleBatchTag = () => {
  if (!selectedKeys.value.length) {
    MessagePlugin.warning('Select templates first.');
    return;
  }
  MessagePlugin.info('Batch tagging opened (mock).');
};

const deleteDialogVisible = ref(false);
const deleteConfirmText = ref('');
const deleteTarget = ref<TaskTemplate | null>(null);

const openDeleteDialog = (row: TaskTemplate) => {
  deleteTarget.value = row;
  deleteConfirmText.value = '';
  deleteDialogVisible.value = true;
};

const confirmDelete = () => {
  if (deleteConfirmText.value !== 'DELETE' || !deleteTarget.value) return;
  MessagePlugin.success(`Deleted ${deleteTarget.value.title} (mock).`);
  deleteDialogVisible.value = false;
};

watch(
  () => ({ ...filters }),
  () => {
    pagination.current = 1;
  },
  { deep: true },
);

onMounted(() => {
  const tag = route.query.tag;
  const tagType = route.query.tagType;
  const sort = route.query.sort;
  if (typeof tag === 'string' && typeof tagType === 'string') {
    if (tagType === 'mood') filters.moods = [tag];
    if (tagType === 'direction') filters.directions = [tag];
    if (tagType === 'trace') filters.traces = [tag];
  }
  if (typeof sort === 'string') {
    filters.sort = sort;
  }
  void load();
});
</script>

<style scoped>
.delete-dialog {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
</style>
