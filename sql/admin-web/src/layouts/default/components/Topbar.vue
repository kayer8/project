<template>
  <div class="topbar">
    <div class="title">Admin Console</div>
    <div class="actions">
      <t-button theme="default" variant="text" @click="logout">Sign out</t-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useUserStore } from '@/store/modules/user';

const router = useRouter();
const userStore = useUserStore();

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
  padding: 0 0 16px 0;
}

.title {
  font-size: 18px;
  font-weight: 600;
}
</style>