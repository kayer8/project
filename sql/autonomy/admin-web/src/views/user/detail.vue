<template>
  <PageContainer
    title="用户详情"
    description="聚合查看账号资料、社区角色、房屋成员关系和认证记录。"
  >
    <t-button variant="outline" @click="router.push('/users/list')">返回列表</t-button>

    <t-card v-if="!user" title="未找到用户">
      <p>当前用户不存在，或本地演示数据中尚未收录。</p>
    </t-card>

    <template v-else>
      <t-row :gutter="[16, 16]">
        <t-col :span="6">
          <t-card title="账号资料">
            <div class="info-grid">
              <div class="label">姓名</div>
              <div>{{ user.realName }}</div>
              <div class="label">昵称</div>
              <div>{{ user.nickname }}</div>
              <div class="label">手机号</div>
              <div>{{ user.mobile || '未绑定' }}</div>
              <div class="label">账号状态</div>
              <div>
                <t-tag :theme="user.status === 'ACTIVE' ? 'success' : user.status === 'DISABLED' ? 'warning' : 'danger'" variant="light">
                  {{ userStatusLabelMap[user.status] }}
                </t-tag>
              </div>
              <div class="label">注册来源</div>
              <div>{{ user.registerSource }}</div>
              <div class="label">OpenID</div>
              <div class="mono">{{ user.wechatOpenid }}</div>
              <div class="label">UnionID</div>
              <div class="mono">{{ user.wechatUnionid || '无' }}</div>
              <div class="label">注册时间</div>
              <div>{{ user.createdAt }}</div>
              <div class="label">最近登录</div>
              <div>{{ user.lastLoginAt || '暂无' }}</div>
            </div>
          </t-card>
        </t-col>

        <t-col :span="6">
          <t-card title="社区角色">
            <div v-if="user.communityRoles.length === 0" class="empty-text">当前没有社区层角色。</div>
            <div v-else class="section-list">
              <div v-for="item in user.communityRoles" :key="`${item.communityName}-${item.roleType}`" class="section-item">
                <div class="item-title">
                  {{ item.communityName }} · {{ communityRoleLabelMap[item.roleType] }}
                </div>
                <div class="item-sub">
                  状态：{{ communityRoleStatusLabelMap[item.status] }} ｜ 生效：{{ item.effectiveAt }}
                </div>
              </div>
            </div>
          </t-card>
        </t-col>
      </t-row>

      <t-card title="房屋成员关系">
        <t-table :data="user.houseRelations" :columns="houseColumns" row-key="id" size="small">
          <template #relationType="{ row }">
            {{ memberRelationLabelMap[row.relationType] }}
          </template>

          <template #status="{ row }">
            <t-tag :theme="row.status === 'ACTIVE' ? 'success' : row.status === 'PENDING' ? 'warning' : 'default'" variant="light">
              {{ memberRelationStatusLabelMap[row.status] }}
            </t-tag>
          </template>

          <template #permissions="{ row }">
            <div class="permission-list">
              <t-tag v-if="row.isPrimaryRole" theme="primary" variant="light">主角色</t-tag>
              <t-tag v-if="row.canViewBill" variant="light">可看账单</t-tag>
              <t-tag v-if="row.canPayBill" variant="light">可缴费</t-tag>
              <t-tag v-if="row.canActAsAgent" variant="light">可代办</t-tag>
              <t-tag v-if="row.canJoinConsultation" variant="light">可参与意见征集</t-tag>
              <t-tag v-if="row.canBeVoteDelegate" variant="light">可做投票代表</t-tag>
            </div>
          </template>
        </t-table>
      </t-card>

      <t-card title="认证申请记录">
        <t-table :data="user.identityApplications" :columns="identityColumns" row-key="id" size="small">
          <template #applicationType="{ row }">
            {{ identityApplicationLabelMap[row.applicationType] }}
          </template>

          <template #status="{ row }">
            <t-tag :theme="row.status === 'APPROVED' ? 'success' : row.status === 'REJECTED' ? 'danger' : 'warning'" variant="light">
              {{ reviewStatusLabelMap[row.status] }}
            </t-tag>
          </template>
        </t-table>
      </t-card>
    </template>
  </PageContainer>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import PageContainer from '@/components/PageContainer/index.vue';
import { fetchUserDetail } from '@/modules/user/api';
import type { UserDetail } from '@/modules/user/types';
import {
  communityRoleLabelMap,
  communityRoleStatusLabelMap,
  identityApplicationLabelMap,
  memberRelationLabelMap,
  memberRelationStatusLabelMap,
  reviewStatusLabelMap,
  userStatusLabelMap,
} from '@/modules/user/types';

const route = useRoute();
const router = useRouter();
const user = ref<UserDetail | null>(null);

const houseColumns = [
  { colKey: 'houseDisplayName', title: '房屋', width: 180 },
  { colKey: 'communityName', title: '社区', width: 120 },
  { colKey: 'householdType', title: '住户组', width: 120 },
  { colKey: 'relationType', title: '成员关系', width: 120 },
  { colKey: 'status', title: '状态', width: 100 },
  { colKey: 'permissions', title: '权限', minWidth: 320 },
  { colKey: 'effectiveAt', title: '生效时间', width: 160 },
];

const identityColumns = [
  { colKey: 'applicationType', title: '申请类型', width: 140 },
  { colKey: 'houseDisplayName', title: '目标房屋', width: 180 },
  { colKey: 'status', title: '审核状态', width: 120 },
  { colKey: 'submittedAt', title: '提交时间', width: 160 },
  { colKey: 'reviewedAt', title: '审核时间', width: 160 },
];

const load = async () => {
  const id = String(route.params.id || '');
  user.value = await fetchUserDetail(id);
};

onMounted(() => {
  void load();
});
</script>

<style scoped>
.info-grid {
  display: grid;
  grid-template-columns: 120px 1fr;
  gap: 12px 16px;
  align-items: start;
}

.label {
  color: #5f6b7a;
}

.mono {
  font-family: Consolas, monospace;
  word-break: break-all;
}

.empty-text {
  color: #5f6b7a;
}

.section-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.section-item {
  padding: 12px 14px;
  border-radius: 12px;
  background: #f8fafc;
}

.item-title {
  font-weight: 600;
}

.item-sub {
  margin-top: 6px;
  color: #5f6b7a;
}

.permission-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
</style>
