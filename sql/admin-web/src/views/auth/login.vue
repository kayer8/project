<template>
  <div class="login-card">
    <t-card title="管理后台登录">
      <t-form @submit.prevent="handleSubmit">
        <t-form-item label="用户名">
          <t-input v-model="form.username" placeholder="请输入用户名" />
        </t-form-item>
        <t-form-item label="密码">
          <t-input v-model="form.password" type="password" placeholder="请输入密码" />
        </t-form-item>
        <t-form-item>
          <t-button theme="primary" type="submit" block>登录</t-button>
        </t-form-item>
      </t-form>
    </t-card>
  </div>
</template>

<script setup lang="ts">
import { reactive } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useUserStore } from '@/store/modules/user';

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();

const form = reactive({
  username: '',
  password: '',
});

const handleSubmit = () => {
  userStore.login('demo-token');
  const redirect = (route.query.redirect as string) || '/dashboard';
  router.push(redirect);
};
</script>

<style scoped>
.login-card {
  width: 360px;
}
</style>
