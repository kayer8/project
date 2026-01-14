<template>
  <PageContainer title="User List">
    <BaseTable :data="[]" :columns="columns" />
  </PageContainer>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import PageContainer from '@/components/PageContainer/index.vue';
import BaseTable from '@/components/BaseTable/index.vue';

const columns = ref([
  { colKey: 'name', title: 'Name' },
  { colKey: 'role', title: 'Role' },
]);
</script>