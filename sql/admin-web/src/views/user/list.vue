<template>
  <PageContainer title="用户列表">
    <BaseTable :data="items" :columns="columns" />
  </PageContainer>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import PageContainer from '@/components/PageContainer/index.vue';
import BaseTable from '@/components/BaseTable/index.vue';
import { fetchUserList } from '@/modules/user/api';
import type { UserItem } from '@/modules/user/types';

const columns = ref([
  { colKey: 'name', title: '姓名' },
  { colKey: 'role', title: '角色' },
]);

const items = ref<UserItem[]>([]);

const load = async () => {
  items.value = await fetchUserList();
};

onMounted(() => {
  void load();
});
</script>
