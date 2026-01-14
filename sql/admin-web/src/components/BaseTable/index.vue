<template>
  <t-table :data="data" :columns="columns" row-key="id" />
</template>

<script setup lang="ts">
import type { TableProps } from 'tdesign-vue-next';

defineProps<{ data: TableProps['data']; columns: TableProps['columns'] }>();
</script>