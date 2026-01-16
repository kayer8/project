<template>
  <ListPage
    title="Copy Templates"
    v-model:keyword="filters.keyword"
    v-model:sort="filters.sort"
    :sort-options="sortOptions"
  >
    <template #actions>
      <t-space>
        <t-button theme="primary" @click="goCreate">New Copy</t-button>
        <t-button variant="outline" @click="handleExport">Export</t-button>
      </t-space>
    </template>

    <template #filters>
      <t-select v-model="filters.type" placeholder="Type" clearable :options="copyTemplateTypeOptions" />
      <t-select
        v-model="filters.status"
        placeholder="Status"
        clearable
        :options="[
          { label: 'Enabled', value: 'enabled' },
          { label: 'Disabled', value: 'disabled' },
        ]"
      />
      <t-select v-model="filters.trace" placeholder="Trace tag" clearable :options="traceOptions" />
    </template>

    <template #toolbar-actions>
      <t-space>
        <t-button variant="outline" @click="handleBatchEnable">Batch Enable</t-button>
        <t-button variant="outline" @click="handleBatchDisable">Batch Disable</t-button>
      </t-space>
    </template>

    <t-table
      row-key="id"
      :data="pagedItems"
      :columns="columns"
      :hover="true"
      :selected-row-keys="selectedKeys"
      :scroll="{ x: 1200 }"
      @select-change="handleSelectChange"
      @row-click="handleRowClick"
    >
      <template #status="{ row }">
        <t-tag :theme="row.status === 'enabled' ? 'success' : 'default'" variant="light">
          {{ row.status === 'enabled' ? 'Enabled' : 'Disabled' }}
        </t-tag>
      </template>
      <template #content="{ row }">
        <div class="content-preview">{{ row.content }}</div>
      </template>
      <template #conditions="{ row }">
        <div class="content-preview">{{ formatConditions(row.conditions) }}</div>
      </template>
      <template #usage="{ row }">
        {{ row.usage7d ?? '-' }}
      </template>
      <template #operation="{ row }">
        <t-space size="small">
          <t-link theme="primary" @click.stop="goEdit(row)">Edit</t-link>
          <t-link theme="default" @click.stop="handleCopy(row)">Copy</t-link>
          <t-link theme="default" @click.stop="handleToggleStatus(row)">
            {{ row.status === 'enabled' ? 'Disable' : 'Enable' }}
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
import { useRouter } from 'vue-router';
import { DialogPlugin, MessagePlugin } from 'tdesign-vue-next';
import ListPage from '@/components/ListPage/index.vue';
import { useTableSelection } from '@/hooks/useTableSelection';
import { usePermissions } from '@/hooks/usePermissions';
import { copyTemplateTypeOptions, traceOptions } from '@/modules/common/options';
import { fetchCopyTemplates } from '@/modules/copy-templates/api';
import type { CopyTemplate, CopyTemplateConditions } from '@/modules/copy-templates/types';

const router = useRouter();
const { selectedKeys, handleSelectChange, clearSelection } = useTableSelection<string>();
const { isSuperAdmin } = usePermissions();

const items = ref<CopyTemplate[]>([]);

const filters = reactive({
  keyword: '',
  type: '',
  status: '',
  trace: '',
  sort: '',
});

const pagination = reactive({
  current: 1,
  pageSize: 10,
});

const sortOptions = [
  { label: 'Updated (newest)', value: 'updated_desc' },
  { label: 'Usage 7d', value: 'usage_desc' },
];

const columns = [
  { colKey: 'row-select', type: 'multiple', width: 46, fixed: 'left' },
  { colKey: 'id', title: 'Template ID', width: 120 },
  { colKey: 'type', title: 'Type', width: 140 },
  { colKey: 'content', title: 'Content', minWidth: 240 },
  { colKey: 'conditions', title: 'Conditions', width: 180 },
  { colKey: 'status', title: 'Status', width: 110 },
  { colKey: 'usage', title: 'Usage 7d', width: 110 },
  { colKey: 'updatedAt', title: 'Updated at', width: 150 },
  { colKey: 'updatedBy', title: 'Updated by', width: 120 },
  { colKey: 'operation', title: 'Actions', width: 200, fixed: 'right' },
];

const formatConditions = (conditions?: CopyTemplateConditions) => {
  if (!conditions) return '-';
  return Object.entries(conditions)
    .map(([key, value]) => `${key}: ${value}`)
    .join(', ');
};

const load = async () => {
  items.value = await fetchCopyTemplates();
};

const filteredItems = computed(() => {
  const keyword = filters.keyword.trim().toLowerCase();
  return items.value.filter((item) => {
    if (keyword) {
      const match =
        item.content.toLowerCase().includes(keyword) ||
        item.id.toLowerCase().includes(keyword);
      if (!match) return false;
    }
    if (filters.type && item.type !== filters.type) return false;
    if (filters.status && item.status !== filters.status) return false;
    if (filters.trace && item.conditions?.trace !== filters.trace) return false;
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
    case 'usage_desc':
      return list.sort((a, b) => (b.usage7d || 0) - (a.usage7d || 0));
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

const handleRowClick = ({ row }: { row: CopyTemplate }) => {
  router.push(`/copy-templates/${row.id}`);
};

const goCreate = () => {
  router.push('/copy-templates/new');
};

const goEdit = (row: CopyTemplate) => {
  router.push(`/copy-templates/${row.id}`);
};

const handleCopy = (row: CopyTemplate) => {
  DialogPlugin.confirm({
    header: 'Copy template',
    body: 'Create a new draft from this template?',
    onConfirm: () => MessagePlugin.success('Template copied (mock).'),
  });
};

const handleToggleStatus = (row: CopyTemplate) => {
  const next = row.status === 'enabled' ? 'disabled' : 'enabled';
  DialogPlugin.confirm({
    header: `${next === 'enabled' ? 'Enable' : 'Disable'} template`,
    body: `Confirm to set ${row.id} as ${next}?`,
    onConfirm: () => MessagePlugin.success(`Template set to ${next} (mock).`),
  });
};

const handleDelete = (row: CopyTemplate) => {
  DialogPlugin.confirm({
    header: 'Delete template',
    body: `Delete ${row.id}?`,
    onConfirm: () => MessagePlugin.success('Template deleted (mock).'),
  });
};

const handleExport = () => {
  MessagePlugin.success('Exported CSV (mock).');
};

const handleBatchEnable = () => {
  if (!selectedKeys.value.length) {
    MessagePlugin.warning('Select templates first.');
    return;
  }
  MessagePlugin.success(`Enabled ${selectedKeys.value.length} templates (mock).`);
  clearSelection();
};

const handleBatchDisable = () => {
  if (!selectedKeys.value.length) {
    MessagePlugin.warning('Select templates first.');
    return;
  }
  MessagePlugin.success(`Disabled ${selectedKeys.value.length} templates (mock).`);
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
  void load();
});
</script>

<style scoped>
.content-preview {
  max-width: 240px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
