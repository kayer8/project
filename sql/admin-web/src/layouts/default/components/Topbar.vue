<template>
  <div class="topbar">
    <div class="topbar-left">
      <div class="title">{{ appStore.title }}</div>
    </div>
    <div class="topbar-right">
      <t-button theme="default" variant="text" @click="logout">Sign out</t-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useUserStore } from '@/store/modules/user';
import { useAppStore } from '@/store/modules/app';

const router = useRouter();
const userStore = useUserStore();
const appStore = useAppStore();

const logout = () => {
  userStore.logout();
  router.push('/login');
};
</script>

<style scoped>
.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.title {
  font-size: 16px;
  font-weight: 600;
}

.topbar-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.topbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>
