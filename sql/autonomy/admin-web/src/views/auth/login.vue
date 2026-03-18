<template>
  <div class="login-page">
    <t-card title="物业自治管理端">
      <p class="tips">当前是项目骨架。后续在这里接入后台登录接口与权限体系。</p>
      <t-button theme="primary" @click="goDashboard">进入工作台</t-button>
    </t-card>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';

const router = useRouter();

const goDashboard = () => {
  router.push('/dashboard');
};
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: grid;
  place-items: center;
  background: linear-gradient(135deg, #e2e8f0, #f8fafc);
}

.tips {
  margin: 0 0 16px;
  color: #5f6b7a;
}
</style>
