<template>
  <t-layout class="layout-root">
    <t-layout-sider
      class="layout-sider"
      collapsible
      :collapsed="appStore.sidebarCollapsed"
      :width="240"
      @collapsed-change="appStore.toggleSidebar"
    >
      <Sidebar />
    </t-layout-sider>
    <t-layout class="layout-main">
      <t-layout-header class="layout-header">
        <Topbar />
      </t-layout-header>
      <t-layout-content class="layout-content">
        <div class="layout-toolbar">
          <Breadcrumb />
          <AppTabs v-if="appStore.enableTabs" />
        </div>
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
  background: #f3f3f3;
  flex-direction: row;
}

.layout-sider {
  background: #242424;
  border-right: 1px solid #383838;
}

.layout-main {
  background: #f3f3f3;
}

.layout-header {
  padding: 12px 24px;
  background: #ffffff;
  border-bottom: 1px solid #e6e8f0;
}

.layout-content {
  padding: 24px;
  background: #f3f3f3;
}

.layout-toolbar {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}
</style>
