<template>
  <div class="tabs">
    <span v-for="tab in tabs" :key="tab.path" class="tab">{{ tab.title }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useTabsStore } from '@/store/modules/tabs';

const tabsStore = useTabsStore();
const tabs = computed(() => tabsStore.tabs);
</script>

<style scoped>
.tabs {
  display: flex;
  gap: 12px;
  padding: 12px 0;
}

.tab {
  font-size: 12px;
  padding: 4px 8px;
  background: #fff;
  border-radius: 4px;
  border: 1px solid #e6e8f0;
}
</style>