<template>
  <div class="login-card">
    <t-card title="Admin Login">
      <t-form @submit.prevent="handleSubmit">
        <t-form-item label="Username">
          <t-input v-model="form.username" placeholder="Enter username" />
        </t-form-item>
        <t-form-item label="Password">
          <t-input v-model="form.password" type="password" placeholder="Enter password" />
        </t-form-item>
        <t-form-item>
          <t-button theme="primary" type="submit" block>Sign in</t-button>
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