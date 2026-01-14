<template>
  <t-breadcrumb class="breadcrumb">
    <t-breadcrumb-item>Home</t-breadcrumb-item>
    <t-breadcrumb-item>{{ label }}</t-breadcrumb-item>
  </t-breadcrumb>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const label = computed(() => (route.meta?.title as string) || '');
</script>

<style scoped>
.breadcrumb {
  margin-bottom: 0;
}
</style>
