<template>
  <ListPage
    title="夜间引导"
    v-model:keyword="filters.keyword"
    v-model:sort="filters.sort"
    :sort-options="sortOptions"
  >
    <template #actions>
      <t-space>
        <t-button theme="primary" @click="goCreate">新建引导</t-button>
        <t-button variant="outline" @click="handleExport">导出</t-button>
      </t-space>
    </template>

    <template #filters>
      <t-select v-model="filters.type" placeholder="类型" clearable :options="nightProgramTypeOptions" />
      <t-select v-model="filters.status" placeholder="状态" clearable :options="statusOptions" />
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
          {{ formatStatus(row.status) }}
        </t-tag>
      </template>
      <template #tags="{ row }">
        <TagSummary :tags="formatTags(row)" />
      </template>
      <template #duration="{ row }">
        {{ row.duration ? `${row.duration}秒` : '-' }}
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
          <t-link theme="primary" @click.stop="goEdit(row)">编辑</t-link>
          <t-link theme="default" @click.stop="handleCopy(row)">复制</t-link>
          <t-link theme="default" @click.stop="handleToggleStatus(row)">
            {{ row.status === 'online' ? '下线' : '上线' }}
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
  getOptionLabel,
  mapOptionLabels,
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
  { label: '更新时间（新到旧）', value: 'updated_desc' },
  { label: '近7天完成率', value: 'completion_desc' },
  { label: '近7天曝光', value: 'exposure_desc' },
];

const columns = [
  { colKey: 'row-select', type: 'multiple', width: 46, fixed: 'left' },
  { colKey: 'id', title: '引导ID', width: 120 },
  { colKey: 'title', title: '标题', minWidth: 180 },
  {
    colKey: 'type',
    title: '类型',
    width: 100,
    cell: ({ row }: { row: NightProgram }) => formatType(row.type),
  },
  { colKey: 'duration', title: '时长', width: 110 },
  { colKey: 'status', title: '状态', width: 100 },
  { colKey: 'tags', title: '标签', width: 180 },
  { colKey: 'updatedAt', title: '更新时间', width: 150 },
  { colKey: 'updatedBy', title: '更新人', width: 120 },
  { colKey: 'exposure', title: '近7天曝光', width: 130 },
  { colKey: 'completionRate', title: '近7天完成率', width: 140 },
  { colKey: 'exitRate', title: '近7天退出率', width: 120 },
  { colKey: 'operation', title: '操作', width: 200, fixed: 'right' },
];

const formatStatus = (status: NightProgram['status']) => getOptionLabel(statusOptions, status);
const formatType = (type: NightProgram['type']) => getOptionLabel(nightProgramTypeOptions, type);
const formatTags = (row: NightProgram) => [
  ...mapOptionLabels(moodOptions, row.tags.moods),
  ...mapOptionLabels(directionOptions, row.tags.directions),
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
    header: '复制引导',
    body: `确认复制「${row.title}」为草稿？`,
    onConfirm: () => MessagePlugin.success('已复制为草稿（模拟）。'),
  });
};

const handleToggleStatus = (row: NightProgram) => {
  const next = row.status === 'online' ? 'offline' : 'online';
  const nextLabel = next === 'online' ? '上线' : '下线';
  DialogPlugin.confirm({
    header: `${nextLabel}引导`,
    body: `确认将「${row.title}」设为${nextLabel}？`,
    onConfirm: () => MessagePlugin.success(`引导已设为${nextLabel}（模拟）。`),
  });
};

const handleDelete = (row: NightProgram) => {
  DialogPlugin.confirm({
    header: '删除引导',
    body: `确认删除「${row.title}」？`,
    onConfirm: () => MessagePlugin.success('引导已删除（模拟）。'),
  });
};

const handleExport = () => {
  MessagePlugin.success('已导出 CSV（模拟）。');
};

const handleBatchOnline = () => {
  if (!selectedKeys.value.length) {
    MessagePlugin.warning('请先选择引导内容。');
    return;
  }
  MessagePlugin.success(`已将 ${selectedKeys.value.length} 个引导上线（模拟）。`);
  clearSelection();
};

const handleBatchOffline = () => {
  if (!selectedKeys.value.length) {
    MessagePlugin.warning('请先选择引导内容。');
    return;
  }
  MessagePlugin.success(`已将 ${selectedKeys.value.length} 个引导下线（模拟）。`);
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

