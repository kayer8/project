<template>
  <ListPage
    title="文案模板"
    v-model:keyword="filters.keyword"
    v-model:sort="filters.sort"
    :sort-options="sortOptions"
  >
    <template #actions>
      <t-space>
        <t-button theme="primary" @click="goCreate">新建文案</t-button>
        <t-button variant="outline" @click="handleExport">导出</t-button>
      </t-space>
    </template>

    <template #filters>
      <t-select v-model="filters.type" placeholder="类型" clearable :options="copyTemplateTypeOptions" />
      <t-select
        v-model="filters.status"
        placeholder="状态"
        clearable
        :options="[
          { label: '启用', value: 'enabled' },
          { label: '停用', value: 'disabled' },
        ]"
      />
      <t-select v-model="filters.trace" placeholder="追踪标签" clearable :options="traceOptions" />
    </template>

    <template #toolbar-actions>
      <t-space>
        <t-button variant="outline" @click="handleBatchEnable">批量启用</t-button>
        <t-button variant="outline" @click="handleBatchDisable">批量停用</t-button>
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
          {{ row.status === 'enabled' ? '启用' : '停用' }}
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
          <t-link theme="primary" @click.stop="goEdit(row)">编辑</t-link>
          <t-link theme="default" @click.stop="handleCopy(row)">复制</t-link>
          <t-link theme="default" @click.stop="handleToggleStatus(row)">
            {{ row.status === 'enabled' ? '停用' : '启用' }}
          </t-link>
          <t-link v-if="isSuperAdmin" theme="danger" @click.stop="handleDelete(row)">
            删除
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
import {
  copyTemplateTypeOptions,
  traceOptions,
  moodOptions,
  directionOptions,
  getOptionLabel,
} from '@/modules/common/options';
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
  { label: '更新时间（新到旧）', value: 'updated_desc' },
  { label: '近7天命中次数', value: 'usage_desc' },
];

const columns = [
  { colKey: 'row-select', type: 'multiple', width: 46, fixed: 'left' },
  { colKey: 'id', title: '模板ID', width: 120 },
  {
    colKey: 'type',
    title: '类型',
    width: 140,
    cell: ({ row }: { row: CopyTemplate }) => getOptionLabel(copyTemplateTypeOptions, row.type),
  },
  { colKey: 'content', title: '文案内容', minWidth: 240 },
  { colKey: 'conditions', title: '适用条件', width: 180 },
  { colKey: 'status', title: '状态', width: 110 },
  { colKey: 'usage', title: '近7天命中', width: 110 },
  { colKey: 'updatedAt', title: '更新时间', width: 150 },
  { colKey: 'updatedBy', title: '更新人', width: 120 },
  { colKey: 'operation', title: '操作', width: 200, fixed: 'right' },
];

const formatConditions = (conditions?: CopyTemplateConditions) => {
  if (!conditions) return '-';
  return Object.entries(conditions)
    .map(([key, value]) => {
      const label =
        key === 'trace' ? '追踪标签' : key === 'mood' ? '心情标签' : key === 'direction' ? '方向标签' : key;
      const mappedValue =
        key === 'trace'
          ? getOptionLabel(traceOptions, value)
          : key === 'mood'
            ? getOptionLabel(moodOptions, value)
            : key === 'direction'
              ? getOptionLabel(directionOptions, value)
              : value;
      return `${label}: ${mappedValue}`;
    })
    .join('，');
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
    header: '复制模板',
    body: '确认基于该模板新建草稿？',
    onConfirm: () => MessagePlugin.success('模板已复制（模拟）。'),
  });
};

const handleToggleStatus = (row: CopyTemplate) => {
  const next = row.status === 'enabled' ? 'disabled' : 'enabled';
  const nextLabel = next === 'enabled' ? '启用' : '停用';
  DialogPlugin.confirm({
    header: `${nextLabel}模板`,
    body: `确认将 ${row.id} 设为${nextLabel}？`,
    onConfirm: () => MessagePlugin.success(`模板已设为${nextLabel}（模拟）。`),
  });
};

const handleDelete = (row: CopyTemplate) => {
  DialogPlugin.confirm({
    header: '删除模板',
    body: `确认删除 ${row.id}？`,
    onConfirm: () => MessagePlugin.success('模板已删除（模拟）。'),
  });
};

const handleExport = () => {
  MessagePlugin.success('已导出 CSV（模拟）。');
};

const handleBatchEnable = () => {
  if (!selectedKeys.value.length) {
    MessagePlugin.warning('请先选择模板。');
    return;
  }
  MessagePlugin.success(`已启用 ${selectedKeys.value.length} 条模板（模拟）。`);
  clearSelection();
};

const handleBatchDisable = () => {
  if (!selectedKeys.value.length) {
    MessagePlugin.warning('请先选择模板。');
    return;
  }
  MessagePlugin.success(`已停用 ${selectedKeys.value.length} 条模板（模拟）。`);
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

