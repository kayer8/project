<template>
  <ListPage
    title="任务模板"
    v-model:keyword="filters.keyword"
    v-model:sort="filters.sort"
    :sort-options="sortOptions"
  >
    <template #actions>
      <t-space>
        <t-button theme="primary" @click="goCreate">新建任务</t-button>
        <t-button variant="outline" @click="handleImport">导入</t-button>
        <t-button variant="outline" @click="handleExport">导出</t-button>
      </t-space>
    </template>

    <template #filters>
      <t-select v-model="filters.status" placeholder="状态" clearable :options="statusOptions" />
      <t-select v-model="filters.type" placeholder="类型" clearable :options="taskTypeOptions" />
      <t-select v-model="filters.difficulty" placeholder="难度" clearable :options="difficultyOptions" />
      <t-select
        v-model="filters.moods"
        placeholder="心情标签"
        multiple
        clearable
        :options="moodOptions"
      />
      <t-select
        v-model="filters.directions"
        placeholder="方向标签"
        multiple
        clearable
        :options="directionOptions"
      />
      <t-select
        v-model="filters.traces"
        placeholder="追踪标签"
        multiple
        clearable
        :options="traceOptions"
      />
      <t-date-range-picker v-model="filters.updatedAt" value-type="YYYY-MM-DD" />
      <t-input-number
        v-model="filters.completionBelow"
        placeholder="完成率 <"
        :min="0"
        :max="100"
        :step="5"
        suffix="%"
      />
    </template>

    <template #toolbar-actions>
      <t-space>
        <t-button variant="outline" @click="handleBatchOnline">批量上线</t-button>
        <t-button variant="outline" @click="handleBatchOffline">批量下线</t-button>
        <t-button variant="outline" @click="handleBatchTag">批量打标签</t-button>
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
          {{ formatStatus(row.status) }}
        </t-tag>
      </template>
      <template #type="{ row }">
        {{ formatType(row.type) }}
      </template>
      <template #tagSummary="{ row }">
        <TagSummary :tags="getTagSummary(row)" />
      </template>
      <template #moods="{ row }">
        <TagSummary :tags="formatMoods(row.tags.moods)" />
      </template>
      <template #directions="{ row }">
        <TagSummary :tags="formatDirections(row.tags.directions)" />
      </template>
      <template #traces="{ row }">
        <TagSummary :tags="formatTraces(row.tags.traces)" />
      </template>
      <template #defaultDuration="{ row }">
        {{ row.type === 'timer' ? `${row.defaultDuration}秒` : '-' }}
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
          <t-link theme="primary" @click.stop="goEdit(row)">编辑</t-link>
          <t-link theme="default" @click.stop="handleCopy(row)">复制</t-link>
          <t-link theme="default" @click.stop="handleToggleStatus(row)">
            {{ row.status === 'online' ? '下线' : '上线' }}
          </t-link>
          <t-link
            v-if="isSuperAdmin"
            theme="danger"
            @click.stop="openDeleteDialog(row)"
          >
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

  <t-dialog
    v-model:visible="deleteDialogVisible"
    header="删除模板"
    :confirm-btn="{ content: '删除', disabled: deleteConfirmText !== 'DELETE' }"
    cancel-btn="取消"
    @confirm="confirmDelete"
  >
    <div class="delete-dialog">
      <p>请输入 DELETE 确认删除该模板。</p>
      <t-input v-model="deleteConfirmText" placeholder="请输入 DELETE" />
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
  getOptionLabel,
  mapOptionLabels,
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
  { label: '创建时间（新到旧）', value: 'created_desc' },
  { label: '更新时间（新到旧）', value: 'updated_desc' },
  { label: '近7天完成率', value: 'completion_desc' },
  { label: '近7天曝光', value: 'exposure_desc' },
];

const columns = [
  { colKey: 'row-select', type: 'multiple', width: 46, fixed: 'left' },
  { colKey: 'id', title: '模板ID', width: 120 },
  { colKey: 'title', title: '标题', minWidth: 180 },
  { colKey: 'type', title: '类型', width: 90 },
  { colKey: 'difficulty', title: '难度', width: 100 },
  { colKey: 'status', title: '状态', width: 100 },
  { colKey: 'tagSummary', title: '标签摘要', width: 160 },
  { colKey: 'moods', title: '心情标签', width: 150 },
  { colKey: 'directions', title: '方向标签', width: 160 },
  { colKey: 'traces', title: '追踪标签', width: 160 },
  { colKey: 'defaultDuration', title: '默认时长', width: 150 },
  { colKey: 'updatedAt', title: '更新时间', width: 150 },
  { colKey: 'updatedBy', title: '更新人', width: 120 },
  { colKey: 'exposure', title: '近7天曝光', width: 130 },
  { colKey: 'completionRate', title: '近7天完成率', width: 140 },
  { colKey: 'skipRate', title: '近7天跳过率', width: 120 },
  { colKey: 'replaceRate', title: '近7天换出率', width: 120 },
  { colKey: 'operation', title: '操作', width: 200, fixed: 'right' },
];

const formatStatus = (status: TaskTemplate['status']) => getOptionLabel(statusOptions, status);
const formatType = (type: TaskTemplate['type']) => getOptionLabel(taskTypeOptions, type);
const formatMoods = (tags: string[]) => mapOptionLabels(moodOptions, tags);
const formatDirections = (tags: string[]) => mapOptionLabels(directionOptions, tags);
const formatTraces = (tags: string[]) => mapOptionLabels(traceOptions, tags);

const getTagSummary = (row: TaskTemplate) => [
  ...formatMoods(row.tags.moods),
  ...formatDirections(row.tags.directions),
  ...formatTraces(row.tags.traces),
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
    header: '复制模板',
    body: `确认复制「${row.title}」为草稿？`,
    onConfirm: () => MessagePlugin.success('已复制为草稿（模拟）。'),
  });
};

const handleToggleStatus = (row: TaskTemplate) => {
  const next = row.status === 'online' ? 'offline' : 'online';
  const nextLabel = next === 'online' ? '上线' : '下线';
  DialogPlugin.confirm({
    header: `${nextLabel}模板`,
    body: `确认将「${row.title}」设为${nextLabel}？`,
    onConfirm: () => MessagePlugin.success(`模板已设为${nextLabel}（模拟）。`),
  });
};

const handleImport = () => {
  MessagePlugin.info('已打开导入预览（模拟）。');
};

const handleExport = () => {
  MessagePlugin.success('已导出 CSV（模拟）。');
};

const handleBatchOnline = () => {
  if (!selectedKeys.value.length) {
    MessagePlugin.warning('请先选择模板。');
    return;
  }
  MessagePlugin.success(`已将 ${selectedKeys.value.length} 个模板上线（模拟）。`);
  clearSelection();
};

const handleBatchOffline = () => {
  if (!selectedKeys.value.length) {
    MessagePlugin.warning('请先选择模板。');
    return;
  }
  MessagePlugin.success(`已将 ${selectedKeys.value.length} 个模板下线（模拟）。`);
  clearSelection();
};

const handleBatchTag = () => {
  if (!selectedKeys.value.length) {
    MessagePlugin.warning('请先选择模板。');
    return;
  }
  MessagePlugin.info('已打开批量打标签（模拟）。');
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
  MessagePlugin.success(`已删除「${deleteTarget.value.title}」（模拟）。`);
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

