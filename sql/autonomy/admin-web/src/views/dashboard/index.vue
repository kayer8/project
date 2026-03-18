<template>
  <PageContainer
    title="物业自治工作台"
    description="管理端骨架已建立，后续在这里接入认证审核、成员审核、投票管理、公开内容管理和财务管理模块。"
  >
    <t-row :gutter="[16, 16]">
      <t-col :span="4" v-for="item in cards" :key="item.title">
        <t-card :title="item.title">
          <div class="card-value">{{ item.value }}</div>
          <div class="card-desc">{{ item.description }}</div>
        </t-card>
      </t-col>
    </t-row>
  </PageContainer>
</template>

<script setup lang="ts">
import PageContainer from '@/components/PageContainer/index.vue';

const cards = [
  { title: '待审核认证', value: '0', description: '接入 identity 审核流' },
  { title: '待审成员', value: '0', description: '接入 member 审核流' },
  { title: '进行中投票', value: '0', description: '接入 vote 管理' },
  { title: '本月公开', value: '0', description: '接入 disclosure 发布' },
];
</script>

<style scoped>
.card-value {
  font-size: 32px;
  font-weight: 700;
}

.card-desc {
  margin-top: 8px;
  color: #5f6b7a;
}
</style>
