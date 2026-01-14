<template>
  <PageContainer title="Content List">
    <BaseTable :data="[]" :columns="columns" />
  </PageContainer>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import PageContainer from '@/components/PageContainer/index.vue';
import BaseTable from '@/components/BaseTable/index.vue';

const columns = ref([
  { colKey: 'title', title: 'Title' },
  { colKey: 'author', title: 'Author' },
]);
</script>