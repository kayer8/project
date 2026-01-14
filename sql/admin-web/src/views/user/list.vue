<template>
  <PageContainer title="User List">
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
  { colKey: 'name', title: 'Name' },
  { colKey: 'role', title: 'Role' },
]);

const items = ref<UserItem[]>([]);

const load = async () => {
  items.value = await fetchUserList();
};

onMounted(() => {
  void load();
});
</script>
