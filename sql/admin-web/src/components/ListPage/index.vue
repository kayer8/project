<template>
  <PageContainer :title="title">
    <template #actions>
      <slot name="actions" />
    </template>
    <div class="list-toolbar">
      <div class="list-row">
        <t-input
          v-if="showSearch"
          v-model="keywordProxy"
          class="list-search"
          clearable
          :placeholder="searchPlaceholder"
        />
        <slot name="filters" />
        <t-select
          v-if="showSort"
          v-model="sortProxy"
          class="list-sort"
          clearable
          placeholder="Sort by"
          :options="sortOptions"
        />
        <div class="list-spacer" />
        <slot name="toolbar-actions" />
      </div>
      <slot name="secondary" />
    </div>
    <div class="list-table">
      <slot />
    </div>
    <div class="list-pagination">
      <slot name="pagination" />
    </div>
  </PageContainer>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import PageContainer from '@/components/PageContainer/index.vue';

type SortOption = {
  label: string;
  value: string;
};

const props = withDefaults(
  defineProps<{
    title: string;
    keyword?: string;
    searchPlaceholder?: string;
    sort?: string;
    sortOptions?: SortOption[];
    showSearch?: boolean;
  }>(),
  {
    keyword: '',
    searchPlaceholder: 'Search by title or ID',
    sort: '',
    sortOptions: () => [],
    showSearch: true,
  },
);

const emit = defineEmits<{
  (event: 'update:keyword', value: string): void;
  (event: 'update:sort', value: string): void;
}>();

const keywordProxy = computed({
  get: () => props.keyword ?? '',
  set: (value) => emit('update:keyword', value),
});

const sortProxy = computed({
  get: () => props.sort ?? '',
  set: (value) => emit('update:sort', value),
});

const showSort = computed(() => (props.sortOptions?.length ?? 0) > 0);
</script>

<style scoped>
.list-toolbar {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 16px;
}

.list-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
}

.list-search {
  width: 220px;
}

.list-sort {
  width: 180px;
}

.list-spacer {
  flex: 1;
}

.list-table {
  margin-top: 8px;
}

.list-pagination {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}
</style>
