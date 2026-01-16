<template>
  <PageContainer title="内容列表">
    <BaseTable :data="items" :columns="columns" />
  </PageContainer>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import PageContainer from '@/components/PageContainer/index.vue';
import BaseTable from '@/components/BaseTable/index.vue';
import { useContentList } from '@/modules/content/hooks/useContentList';

const columns = ref([
  { colKey: 'title', title: '标题' },
  { colKey: 'author', title: '作者' },
]);

const { items, load } = useContentList();

onMounted(() => {
  void load();
});
</script>
