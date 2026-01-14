<template>
  <PageContainer title="System Logs">
    <t-card>
      <ul class="log-list">
        <li v-for="log in logs" :key="log.id">{{ log.message }}</li>
      </ul>
    </t-card>
  </PageContainer>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import PageContainer from '@/components/PageContainer/index.vue';
import { fetchSystemLogs } from '@/modules/system/api';
import type { SystemLog } from '@/modules/system/types';

const logs = ref<SystemLog[]>([]);

const load = async () => {
  logs.value = await fetchSystemLogs();
};

onMounted(() => {
  void load();
});
</script>

<style scoped>
.log-list {
  margin: 0;
  padding-left: 18px;
  display: grid;
  gap: 8px;
}
</style>
