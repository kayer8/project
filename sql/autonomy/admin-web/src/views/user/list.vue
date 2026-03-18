<template>
  <PageContainer
    title="用户数据管理"
    description="查看居民账号、社区角色、房屋关系和认证状态。当前页面先以本地数据演示结构，后续直接替换为真实接口。"
  >
    <t-row :gutter="[16, 16]">
      <t-col :span="3" v-for="item in summaryCards" :key="item.title">
        <t-card :title="item.title">
          <div class="summary-value">{{ item.value }}</div>
          <div class="summary-desc">{{ item.description }}</div>
        </t-card>
      </t-col>
    </t-row>

    <t-card title="筛选条件">
      <div class="toolbar">
        <t-input v-model="keyword" clearable placeholder="搜索姓名 / 昵称 / 手机号" />
        <t-select v-model="statusFilter" :options="statusOptions" />
        <t-select v-model="roleFilter" :options="roleOptions" />
        <t-select v-model="communityFilter" :options="communityOptions" />
      </div>
    </t-card>

    <t-card title="用户列表">
      <t-table :data="filteredUsers" :columns="columns" row-key="id" size="small">
        <template #user="{ row }">
          <div class="user-cell">
            <div class="user-name">{{ row.realName }}</div>
            <div class="user-sub">{{ row.nickname }} · {{ row.id }}</div>
          </div>
        </template>

        <template #status="{ row }">
          <t-tag :theme="row.status === 'ACTIVE' ? 'success' : row.status === 'DISABLED' ? 'warning' : 'danger'" variant="light">
            {{ userStatusLabelMap[row.status] }}
          </t-tag>
        </template>

        <template #communities="{ row }">
          <div class="tag-group">
            <t-tag v-for="community in row.communityNames" :key="community" variant="light">
              {{ community }}
            </t-tag>
          </div>
        </template>

        <template #actions="{ row }">
          <t-button variant="text" theme="primary" @click="goDetail(row.id)">查看详情</t-button>
        </template>
      </t-table>
    </t-card>
  </PageContainer>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import PageContainer from '@/components/PageContainer/index.vue';
import { fetchUserList } from '@/modules/user/api';
import type { UserListItem } from '@/modules/user/types';
import { userStatusLabelMap } from '@/modules/user/types';

const router = useRouter();

const users = ref<UserListItem[]>([]);
const keyword = ref('');
const statusFilter = ref('ALL');
const roleFilter = ref('ALL');
const communityFilter = ref('ALL');

const columns = [
  { colKey: 'user', title: '用户', width: 220 },
  { colKey: 'mobile', title: '手机号', width: 140 },
  { colKey: 'status', title: '状态', width: 100 },
  { colKey: 'primaryRoleLabel', title: '主关系', width: 120 },
  { colKey: 'houseCount', title: '房屋数', width: 90 },
  { colKey: 'communities', title: '所属社区', minWidth: 220 },
  { colKey: 'lastLoginAt', title: '最近登录', width: 160 },
  { colKey: 'actions', title: '操作', width: 120, fixed: 'right' },
];

const load = async () => {
  users.value = await fetchUserList();
};

const summaryCards = computed(() => {
  const total = users.value.length;
  const active = users.value.filter((item) => item.status === 'ACTIVE').length;
  const disabled = users.value.filter((item) => item.status === 'DISABLED').length;
  const houses = users.value.reduce((sum, item) => sum + item.houseCount, 0);

  return [
    { title: '用户总数', value: total, description: '居民端账号主体' },
    { title: '正常账号', value: active, description: '当前可登录账号' },
    { title: '停用账号', value: disabled, description: '需要人工排查' },
    { title: '关联房屋数', value: houses, description: '按账号聚合展示' },
  ];
});

const statusOptions = [
  { label: '全部状态', value: 'ALL' },
  { label: '正常', value: 'ACTIVE' },
  { label: '停用', value: 'DISABLED' },
  { label: '已删除', value: 'DELETED' },
];

const roleOptions = computed(() => {
  const values = Array.from(new Set(users.value.map((item) => item.primaryRoleLabel)));
  return [
    { label: '全部关系', value: 'ALL' },
    ...values.map((label) => ({ label, value: label })),
  ];
});

const communityOptions = computed(() => {
  const values = Array.from(new Set(users.value.flatMap((item) => item.communityNames)));
  return [
    { label: '全部社区', value: 'ALL' },
    ...values.map((label) => ({ label, value: label })),
  ];
});

const filteredUsers = computed(() => {
  const normalizedKeyword = keyword.value.trim().toLowerCase();

  return users.value.filter((item) => {
    const matchKeyword =
      !normalizedKeyword ||
      item.realName.toLowerCase().includes(normalizedKeyword) ||
      item.nickname.toLowerCase().includes(normalizedKeyword) ||
      (item.mobile ?? '').includes(normalizedKeyword);

    const matchStatus = statusFilter.value === 'ALL' || item.status === statusFilter.value;
    const matchRole = roleFilter.value === 'ALL' || item.primaryRoleLabel === roleFilter.value;
    const matchCommunity =
      communityFilter.value === 'ALL' || item.communityNames.includes(communityFilter.value);

    return matchKeyword && matchStatus && matchRole && matchCommunity;
  });
});

const goDetail = (id: string) => {
  router.push(`/users/${id}`);
};

onMounted(() => {
  void load();
});
</script>

<style scoped>
.toolbar {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr;
  gap: 12px;
}

.summary-value {
  font-size: 30px;
  font-weight: 700;
}

.summary-desc {
  margin-top: 8px;
  color: #5f6b7a;
}

.user-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.user-name {
  font-weight: 600;
}

.user-sub {
  color: #5f6b7a;
  font-size: 12px;
}

.tag-group {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

@media (max-width: 1200px) {
  .toolbar {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 768px) {
  .toolbar {
    grid-template-columns: 1fr;
  }
}
</style>
