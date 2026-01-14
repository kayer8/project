<template>
  <div class="sidebar">
    <div class="brand">Admin</div>
    <t-menu theme="light" :value="active">
      <t-menu-item value="/dashboard" @click="go('/dashboard')">Dashboard</t-menu-item>
      <t-menu-item value="/content/list" @click="go('/content/list')">Content</t-menu-item>
      <t-menu-item value="/users/list" @click="go('/users/list')">Users</t-menu-item>
      <t-menu-item value="/system/role" @click="go('/system/role')">System</t-menu-item>
    </t-menu>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();

const active = computed(() => route.path);

const go = (path: string) => {
  router.push(path);
};
</script>

<style scoped>
.sidebar {
  height: 100%;
  background: #fff;
  border-right: 1px solid #e6e8f0;
}

.brand {
  padding: 20px 16px;
  font-weight: 600;
  letter-spacing: 0.5px;
}
</style>