<template>
  <t-layout class="layout-root">
    <t-layout-sider
      collapsible
      :collapsed="appStore.sidebarCollapsed"
      :width="220"
      @collapsed-change="appStore.toggleSidebar"
    >
      <Sidebar />
    </t-layout-sider>
    <t-layout>
      <t-layout-header class="layout-header">
        <Topbar />
        <Breadcrumb />
        <AppTabs v-if="appStore.enableTabs" />
      </t-layout-header>
      <t-layout-content class="layout-content">
        <router-view />
      </t-layout-content>
    </t-layout>
  </t-layout>
</template>

<script setup lang="ts">
import { useAppStore } from '@/store/modules/app';
import Sidebar from './components/Sidebar.vue';
import Topbar from './components/Topbar.vue';
import Breadcrumb from './components/Breadcrumb.vue';
import AppTabs from './components/AppTabs.vue';

const appStore = useAppStore();
</script>

<style scoped>
.layout-root {
  min-height: 100vh;
}

.layout-header {
  padding: 16px 24px 0 24px;
  background: #f5f7fb;
}

.layout-content {
  padding: 24px;
}
</style>