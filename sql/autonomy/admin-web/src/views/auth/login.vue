<template>
  <div class="login-page">
    <t-card title="物业自治管理端" class="login-card">
      <div class="form-list">
        <t-input v-model="form.email" placeholder="管理员邮箱" />
        <t-input v-model="form.password" type="password" placeholder="密码，至少 4 位" />
        <t-button theme="primary" :loading="submitting" @click="submit">登录</t-button>
      </div>
    </t-card>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { MessagePlugin } from 'tdesign-vue-next';
import { loginAdmin } from '@/modules/auth/api';
import { useUserStore } from '@/store/modules/user';

const router = useRouter();
const userStore = useUserStore();
const submitting = ref(false);
const form = reactive({
  email: 'admin@example.com',
  password: '1234',
});

const submit = async () => {
  if (!form.email || !form.password) {
    MessagePlugin.warning('请输入邮箱和密码');
    return;
  }

  submitting.value = true;
  try {
    const result = await loginAdmin(form);
    userStore.setToken(result.accessToken);
    userStore.setName(result.admin.email);
    router.push('/votes/list');
  } finally {
    submitting.value = false;
  }
};
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: grid;
  place-items: center;
  background: linear-gradient(135deg, #e2e8f0, #f8fafc);
}

.login-card {
  width: 420px;
}

.form-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
</style>
