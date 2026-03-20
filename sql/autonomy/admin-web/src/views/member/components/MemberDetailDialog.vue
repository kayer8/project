<template>
  <t-dialog
    :visible="visible"
    header="成员详情"
    width="960px"
    :footer="false"
    @update:visible="handleVisibleChange"
  >
    <div class="dialog-body">
      <div class="dialog-toolbar">
        <div class="dialog-desc">查看单条成员关系的用户、房屋、权限和生效状态。</div>
        <div class="dialog-actions">
          <t-button v-if="member" variant="outline" theme="primary" @click="openEdit">编辑关系</t-button>
          <t-button v-if="member" variant="outline" theme="danger" @click="handleDelete">删除关系</t-button>
        </div>
      </div>

      <t-card v-if="loading" title="加载中">
        <div class="empty-text">正在加载成员关系详情...</div>
      </t-card>

      <t-card v-else-if="loadError" title="加载失败">
        <div class="empty-text">{{ loadError }}</div>
      </t-card>

      <t-card v-else-if="!member" title="未找到成员关系">
        <div class="empty-text">当前成员关系不存在，或接口暂未返回数据。</div>
      </t-card>

      <template v-else>
        <t-row :gutter="[16, 16]">
          <t-col :span="6">
            <t-card title="关系资料">
              <div class="info-grid">
                <div class="label">关系 ID</div>
                <div class="mono">{{ member.id }}</div>
                <div class="label">用户</div>
                <div>{{ member.userName }}</div>
                <div class="label">用户 ID</div>
                <div class="mono">{{ member.userId }}</div>
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
                <div class="label">房屋 ID</div>
                <div class="mono">{{ member.houseId }}</div>
                <div class="label">住户组</div>
                <div>{{ member.householdType }}</div>
                <div class="label">住户组 ID</div>
                <div class="mono">{{ member.householdGroupId }}</div>
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
            <t-card title="权限">
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
            </t-card>
          </t-col>
        </t-row>
      </template>
    </div>

    <MemberFormDialog
      v-model:visible="formDialogVisible"
      mode="edit"
      :initial-value="member"
      @success="handleFormSuccess"
    />
  </t-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { MessagePlugin } from 'tdesign-vue-next';
import { fetchMemberDetail, removeMember } from '@/modules/member/api';
import type { MemberDetail } from '@/modules/member/types';
import { memberRelationLabelMap, memberRelationStatusLabelMap } from '@/modules/member/types';
import { formatDateTime, formatText } from '@/utils/format';
import MemberFormDialog from './MemberFormDialog.vue';

const props = defineProps<{
  visible: boolean;
  detailId: string;
}>();

const emit = defineEmits<{
  (event: 'update:visible', value: boolean): void;
  (event: 'success'): void;
}>();

const member = ref<MemberDetail | null>(null);
const loading = ref(false);
const loadError = ref('');
const formDialogVisible = ref(false);

function resolveErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return '加载失败，请稍后重试';
}

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

function handleVisibleChange(value: boolean) {
  emit('update:visible', value);
}

async function loadDetail() {
  if (!props.detailId) {
    member.value = null;
    loadError.value = '';
    return;
  }

  loading.value = true;
  loadError.value = '';
  try {
    member.value = await fetchMemberDetail(props.detailId);
  } catch (error) {
    member.value = null;
    loadError.value = resolveErrorMessage(error);
  } finally {
    loading.value = false;
  }
}

function openEdit() {
  formDialogVisible.value = true;
}

async function handleDelete() {
  if (!member.value || !window.confirm('确认删除这个成员关系吗？')) {
    return;
  }

  await removeMember(member.value.id);
  MessagePlugin.success('成员关系删除成功');
  emit('success');
  emit('update:visible', false);
}

async function handleFormSuccess() {
  await loadDetail();
  emit('success');
}

watch(
  () => [props.visible, props.detailId],
  ([visible]) => {
    if (visible) {
      void loadDetail();
      return;
    }

    formDialogVisible.value = false;
  },
  { immediate: true },
);
</script>

<style scoped>
.dialog-body {
  max-height: 70vh;
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.dialog-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}

.dialog-desc,
.label,
.empty-text {
  color: #64748b;
}

.dialog-actions {
  display: flex;
  gap: 12px;
}

.info-grid {
  display: grid;
  grid-template-columns: 120px 1fr;
  gap: 12px 16px;
  align-items: start;
}

.mono {
  font-family: Consolas, monospace;
  word-break: break-all;
}

.permission-list,
.tag-group {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
</style>
