<template>
  <div class="sidebar">
    <div class="brand">{{ appStore.title }}</div>
    <t-menu class="menu" theme="dark" :value="active">
      <t-menu-item value="/dashboard" @click="go('/dashboard')">Dashboard</t-menu-item>
      <t-menu-item value="/task-templates" @click="go('/task-templates')">Task Templates</t-menu-item>
      <t-menu-item value="/night-programs" @click="go('/night-programs')">Night Programs</t-menu-item>
      <t-menu-item value="/copy-templates" @click="go('/copy-templates')">Copy Templates</t-menu-item>
      <t-menu-item value="/tickets" @click="go('/tickets')">Tickets</t-menu-item>
      <t-menu-item value="/configs" @click="go('/configs')">App Config</t-menu-item>
      <t-submenu value="analytics" title="Analytics">
        <t-menu-item value="/analytics/task-funnel" @click="go('/analytics/task-funnel')">
          Task Funnel
        </t-menu-item>
        <t-menu-item value="/analytics/night-funnel" @click="go('/analytics/night-funnel')">
          Night Funnel
        </t-menu-item>
        <t-menu-item value="/analytics/task-ranking" @click="go('/analytics/task-ranking')">
          Task Ranking
        </t-menu-item>
      </t-submenu>
      <t-menu-item value="/content/list" @click="go('/content/list')">Content</t-menu-item>
      <t-menu-item value="/users/list" @click="go('/users/list')">Users</t-menu-item>
      <t-menu-item value="/system/role" @click="go('/system/role')">System</t-menu-item>
    </t-menu>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAppStore } from '@/store/modules/app';

const route = useRoute();
const router = useRouter();
const appStore = useAppStore();

const active = computed(() => {
  const path = route.path;
  if (path.startsWith('/task-templates')) return '/task-templates';
  if (path.startsWith('/night-programs')) return '/night-programs';
  if (path.startsWith('/copy-templates')) return '/copy-templates';
  if (path.startsWith('/tickets')) return '/tickets';
  if (path.startsWith('/configs')) return '/configs';
  if (path.startsWith('/content')) return '/content/list';
  return path;
});

const go = (path: string) => {
  router.push(path);
};
</script>

<style scoped>
.sidebar {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #242424;
}

.brand {
  padding: 14px 24px;
  font-weight: 600;
  letter-spacing: 0.3px;
  color: #ffffff;
  border-bottom: 1px solid #383838;
}

.menu {
  flex: 1;
  padding: 8px;
  background: transparent;
}

.menu :deep(.t-menu) {
  background: transparent;
}

.menu :deep(.t-menu__item) {
  border-radius: 3px;
  margin-bottom: 4px;
}

.menu :deep(.t-menu__item:hover) {
  background: #2f2f2f;
}

.menu :deep(.t-menu__item--active) {
  background: #2662f0;
  color: #ffffff;
}
</style>
