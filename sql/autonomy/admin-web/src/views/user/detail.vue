<template>
  <PageContainer title="用户详情">
    <div class="page-actions">
      <t-button variant="outline" @click="router.push('/users/list')">返回列表</t-button>
      <t-button v-if="user" variant="outline" theme="primary" @click="openEdit">编辑用户</t-button>
      <t-button v-if="user" variant="outline" theme="danger" @click="handleDelete">删除用户</t-button>
    </div>

    <t-card v-if="!user" title="未找到用户">
      <div class="empty-text">当前用户不存在，或接口暂未返回数据。</div>
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
              <div>{{ formatText(user.mobile, '未绑定') }}</div>
              <div class="label">账号状态</div>
              <div>
                <t-tag :theme="getUserStatusTheme(user.status)" variant="light">
                  {{ userStatusLabelMap[user.status] }}
                </t-tag>
              </div>
              <div class="label">注册来源</div>
              <div>{{ user.registerSource }}</div>
              <div class="label">OpenID</div>
              <div class="mono">{{ user.wechatOpenid }}</div>
              <div class="label">UnionID</div>
              <div class="mono">{{ formatText(user.wechatUnionid) }}</div>
              <div class="label">手机验证</div>
              <div>{{ formatDateTime(user.mobileVerifiedAt, '未验证') }}</div>
              <div class="label">创建时间</div>
              <div>{{ formatDateTime(user.createdAt) }}</div>
              <div class="label">最近登录</div>
              <div>{{ formatDateTime(user.lastLoginAt, '暂无') }}</div>
              <div class="label">删除时间</div>
              <div>{{ formatDateTime(user.deletedAt, '未删除') }}</div>
            </div>
          </t-card>
        </t-col>

        <t-col :span="6">
          <t-card title="社区角色">
            <div v-if="user.communityRoles.length === 0" class="empty-text">当前没有社区层角色。</div>
            <div v-else class="section-list">
              <div
                v-for="item in user.communityRoles"
                :key="`${item.communityId}-${item.roleType}-${item.effectiveAt}`"
                class="section-item"
              >
                <div class="item-title">
                  {{ item.communityName }} / {{ communityRoleLabelMap[item.roleType] }}
                </div>
                <div class="item-sub">状态：{{ communityRoleStatusLabelMap[item.status] }}</div>
                <div class="item-sub">
                  生效：{{ formatDateTime(item.effectiveAt) }}
                  <span v-if="item.expiredAt"> / 失效：{{ formatDateTime(item.expiredAt) }}</span>
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
            <t-tag :theme="getRelationStatusTheme(row.status)" variant="light">
              {{ memberRelationStatusLabelMap[row.status] }}
            </t-tag>
          </template>

          <template #permissions="{ row }">
            <div class="tag-group">
              <t-tag v-if="row.isPrimaryRole" theme="primary" variant="light">主角色</t-tag>
              <t-tag v-if="row.canViewBill" variant="light">可看账单</t-tag>
              <t-tag v-if="row.canPayBill" variant="light">可缴费</t-tag>
              <t-tag v-if="row.canActAsAgent" variant="light">可代办</t-tag>
              <t-tag v-if="row.canJoinConsultation" variant="light">可征集意见</t-tag>
              <t-tag v-if="row.canBeVoteDelegate" variant="light">可做投票代表</t-tag>
              <span
                v-if="
                  !row.isPrimaryRole &&
                  !row.canViewBill &&
                  !row.canPayBill &&
                  !row.canActAsAgent &&
                  !row.canJoinConsultation &&
                  !row.canBeVoteDelegate
                "
                class="muted-text"
              >
                无额外权限
              </span>
            </div>
          </template>

          <template #effectiveAt="{ row }">
            {{ formatDateTime(row.effectiveAt) }}
          </template>

          <template #actions="{ row }">
            <div class="action-group">
              <t-button
                v-if="row.houseId"
                variant="text"
                theme="primary"
                @click="router.push(`/houses/${row.houseId}`)"
              >
                房屋
              </t-button>
              <t-button variant="text" @click="router.push(`/members/${row.id}`)">成员</t-button>
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
            <t-tag :theme="getReviewStatusTheme(row.status)" variant="light">
              {{ reviewStatusLabelMap[row.status] }}
            </t-tag>
          </template>

          <template #submittedAt="{ row }">
            {{ formatDateTime(row.submittedAt) }}
          </template>

          <template #reviewedAt="{ row }">
            {{ formatDateTime(row.reviewedAt, '未审核') }}
          </template>

          <template #actions="{ row }">
            <t-button
              v-if="row.houseId"
              variant="text"
              theme="primary"
              @click="router.push(`/houses/${row.houseId}`)"
            >
              查看房屋
            </t-button>
          </template>
        </t-table>
      </t-card>
    </template>

    <UserFormDialog
      v-model:visible="dialogVisible"
      mode="edit"
      :initial-value="user"
      @success="loadDetail"
    />
  </PageContainer>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import PageContainer from '@/components/PageContainer/index.vue';
import { fetchUserDetail, removeUser } from '@/modules/user/api';
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
import { formatDateTime, formatText } from '@/utils/format';
import UserFormDialog from './components/UserFormDialog.vue';

const route = useRoute();
const router = useRouter();
const user = ref<UserDetail | null>(null);
const dialogVisible = ref(false);

const houseColumns = [
  { colKey: 'houseDisplayName', title: '房屋', width: 180 },
  { colKey: 'buildingName', title: '楼栋', width: 140 },
  { colKey: 'householdType', title: '住户组', width: 120 },
  { colKey: 'relationType', title: '关系类型', width: 120 },
  { colKey: 'status', title: '状态', width: 100 },
  { colKey: 'permissions', title: '权限', minWidth: 320 },
  { colKey: 'effectiveAt', title: '生效时间', width: 160 },
  { colKey: 'actions', title: '操作', width: 120 },
];

const identityColumns = [
  { colKey: 'applicationType', title: '申请类型', width: 140 },
  { colKey: 'houseDisplayName', title: '目标房屋', width: 180 },
  { colKey: 'status', title: '审核状态', width: 120 },
  { colKey: 'submittedAt', title: '提交时间', width: 160 },
  { colKey: 'reviewedAt', title: '审核时间', width: 160 },
  { colKey: 'rejectReason', title: '驳回原因', minWidth: 180 },
  { colKey: 'actions', title: '操作', width: 120 },
];

function getUserStatusTheme(status: UserDetail['status']) {
  if (status === 'ACTIVE') {
    return 'success';
  }
  if (status === 'DISABLED') {
    return 'warning';
  }
  return 'danger';
}

function getRelationStatusTheme(status: string) {
  if (status === 'ACTIVE') {
    return 'success';
  }
  if (status === 'PENDING') {
    return 'warning';
  }
  if (status === 'REJECTED' || status === 'REMOVED') {
    return 'danger';
  }
  return 'default';
}

function getReviewStatusTheme(status: string) {
  if (status === 'APPROVED') {
    return 'success';
  }
  if (status === 'REJECTED') {
    return 'danger';
  }
  return 'warning';
}

async function loadDetail() {
  const id = String(route.params.id || '');
  if (!id) {
    user.value = null;
    return;
  }

  user.value = await fetchUserDetail(id);
}

function openEdit() {
  dialogVisible.value = true;
}

async function handleDelete() {
  if (!user.value || !window.confirm('确认删除这个用户吗？')) {
    return;
  }

  await removeUser(user.value.id);
  void router.push('/users/list');
}

onMounted(() => {
  void loadDetail();
});

watch(
  () => route.params.id,
  () => {
    void loadDetail();
  },
);
</script>

<style scoped>
.page-actions {
  display: flex;
  gap: 12px;
}

.info-grid {
  display: grid;
  grid-template-columns: 120px 1fr;
  gap: 12px 16px;
  align-items: start;
}

.label,
.item-sub,
.muted-text,
.empty-text {
  color: #64748b;
}

.mono {
  font-family: Consolas, monospace;
  word-break: break-all;
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

.tag-group,
.action-group {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
</style>
