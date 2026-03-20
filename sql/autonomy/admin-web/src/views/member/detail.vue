<template>
  <PageContainer title="成员详情">
    <div class="page-actions">
      <t-button variant="outline" @click="router.push('/members/list')">返回列表</t-button>
      <t-button v-if="member" variant="outline" theme="primary" @click="openEdit">编辑关系</t-button>
      <t-button v-if="member" variant="outline" theme="danger" @click="handleDelete">删除关系</t-button>
    </div>

    <t-card v-if="!member" title="未找到成员关系">
      <div class="empty-text">当前成员关系不存在，或接口暂未返回数据。</div>
    </t-card>

    <template v-else>
      <t-row :gutter="[16, 16]">
        <t-col :span="6">
          <t-card title="关系资料">
            <div class="info-grid">
              <div class="label">用户</div>
              <div>{{ member.userName }}</div>
              <div class="label">昵称</div>
              <div>{{ formatText(member.nickname, '无昵称') }}</div>
              <div class="label">手机号</div>
              <div>{{ formatText(member.mobile, '未绑定') }}</div>
              <div class="label">用户状态</div>
              <div>{{ member.userStatus }}</div>
              <div class="label">楼栋</div>
              <div>{{ member.buildingName }}</div>
              <div class="label">房屋</div>
              <div>{{ member.houseDisplayName }}</div>
              <div class="label">住户组</div>
              <div>{{ member.householdType }}</div>
              <div class="label">关系类型</div>
              <div>
                <div class="tag-group">
                  <t-tag v-if="member.isPrimaryRole" theme="primary" variant="light">主角色</t-tag>
                  <span>{{ memberRelationLabelMap[member.relationType] }}</span>
                </div>
              </div>
              <div class="label">状态</div>
              <div>
                <t-tag :theme="getStatusTheme(member.status)" variant="light">
                  {{ memberRelationStatusLabelMap[member.status] }}
                </t-tag>
              </div>
              <div class="label">生效时间</div>
              <div>{{ formatDateTime(member.effectiveAt) }}</div>
              <div class="label">失效时间</div>
              <div>{{ formatDateTime(member.expiredAt, '未失效') }}</div>
              <div class="label">创建时间</div>
              <div>{{ formatDateTime(member.createdAt) }}</div>
              <div class="label">更新时间</div>
              <div>{{ formatDateTime(member.updatedAt) }}</div>
            </div>
          </t-card>
        </t-col>

        <t-col :span="6">
          <t-card title="权限与跳转">
            <div class="permission-list">
              <t-tag v-if="member.canViewBill" variant="light">可查看账单</t-tag>
              <t-tag v-if="member.canPayBill" variant="light">可缴费</t-tag>
              <t-tag v-if="member.canActAsAgent" variant="light">可代办</t-tag>
              <t-tag v-if="member.canJoinConsultation" variant="light">可参与意见征集</t-tag>
              <t-tag v-if="member.canBeVoteDelegate" variant="light">可成为投票代表</t-tag>
              <span
                v-if="
                  !member.canViewBill &&
                  !member.canPayBill &&
                  !member.canActAsAgent &&
                  !member.canJoinConsultation &&
                  !member.canBeVoteDelegate
                "
                class="empty-text"
              >
                当前没有额外权限
              </span>
            </div>

            <div class="link-actions">
              <t-button theme="primary" @click="router.push(`/users/${member.userId}`)">查看用户</t-button>
              <t-button variant="outline" @click="router.push(`/houses/${member.houseId}`)">查看房屋</t-button>
            </div>
          </t-card>
        </t-col>
      </t-row>
    </template>

    <MemberFormDialog
      v-model:visible="dialogVisible"
      mode="edit"
      :initial-value="member"
      @success="loadDetail"
    />
  </PageContainer>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import PageContainer from '@/components/PageContainer/index.vue';
import { fetchMemberDetail, removeMember } from '@/modules/member/api';
import type { MemberDetail } from '@/modules/member/types';
import { memberRelationLabelMap, memberRelationStatusLabelMap } from '@/modules/member/types';
import { formatDateTime, formatText } from '@/utils/format';
import MemberFormDialog from './components/MemberFormDialog.vue';

const route = useRoute();
const router = useRouter();
const member = ref<MemberDetail | null>(null);
const dialogVisible = ref(false);

function getStatusTheme(status: MemberDetail['status']) {
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

async function loadDetail() {
  const id = String(route.params.id || '');
  if (!id) {
    member.value = null;
    return;
  }

  member.value = await fetchMemberDetail(id);
}

function openEdit() {
  dialogVisible.value = true;
}

async function handleDelete() {
  if (!member.value || !window.confirm('确认删除这个成员关系吗？')) {
    return;
  }

  await removeMember(member.value.id);
  void router.push('/members/list');
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
.empty-text {
  color: #64748b;
}

.permission-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag-group {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.link-actions {
  margin-top: 24px;
  display: flex;
  gap: 12px;
}
</style>
