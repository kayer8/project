<template>
  <t-dialog
    :visible="visible"
    :header="mode === 'create' ? '新建成员关系' : '编辑成员关系'"
    :confirm-loading="submitting"
    width="820px"
    @update:visible="handleVisibleChange"
    @confirm="submit"
  >
    <div class="form-grid">
      <div class="field">
        <div class="field-label required">关联用户</div>
        <t-select v-model="form.userId" :options="userOptions" filterable placeholder="请选择用户" />
      </div>
      <div class="field">
        <div class="field-label required">关联房屋</div>
        <t-select v-model="form.houseId" :options="houseOptions" filterable placeholder="请选择房屋" />
      </div>
      <div class="field">
        <div class="field-label required">住户组</div>
        <t-select
          v-model="form.householdGroupId"
          :options="householdGroupOptions"
          placeholder="请选择住户组"
        />
      </div>
      <div class="field">
        <div class="field-label required">关系类型</div>
        <t-select v-model="form.relationType" :options="relationOptions" placeholder="请选择关系类型" />
      </div>
      <div class="field">
        <div class="field-label">关系标签</div>
        <t-input v-model="form.relationLabel" placeholder="可选，自定义补充说明" />
      </div>
      <div class="field">
        <div class="field-label">关系状态</div>
        <t-select v-model="form.status" :options="statusOptions" />
      </div>
      <div class="field">
        <div class="field-label">生效日期</div>
        <input v-model="form.effectiveAt" class="native-input" type="date" />
      </div>
      <div class="field">
        <div class="field-label">失效日期</div>
        <input v-model="form.expiredAt" class="native-input" type="date" />
      </div>
    </div>

    <div class="checkbox-section">
      <div class="section-title">权限与标记</div>
      <label class="checkbox-item">
        <input v-model="form.isPrimaryRole" type="checkbox" />
        <span>主角色</span>
      </label>
      <label class="checkbox-item">
        <input v-model="form.canViewBill" type="checkbox" />
        <span>可查看账单</span>
      </label>
      <label class="checkbox-item">
        <input v-model="form.canPayBill" type="checkbox" />
        <span>可缴费</span>
      </label>
      <label class="checkbox-item">
        <input v-model="form.canActAsAgent" type="checkbox" />
        <span>可代办</span>
      </label>
      <label class="checkbox-item">
        <input v-model="form.canJoinConsultation" type="checkbox" />
        <span>可参与意见征集</span>
      </label>
      <label class="checkbox-item">
        <input v-model="form.canBeVoteDelegate" type="checkbox" />
        <span>可成为投票代表</span>
      </label>
    </div>
  </t-dialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { MessagePlugin } from 'tdesign-vue-next';
import { fetchHouseDetail, fetchHouseList } from '@/modules/house/api';
import { createMember, updateMember } from '@/modules/member/api';
import type { CreateAdminMemberPayload, MemberDetail } from '@/modules/member/types';
import { memberRelationOptions } from '@/modules/member/types';
import { fetchUserList } from '@/modules/user/api';
import { toDateInputValue } from '@/utils/format';

const props = defineProps<{
  visible: boolean;
  mode: 'create' | 'edit';
  initialValue?: MemberDetail | null;
}>();

const emit = defineEmits<{
  (event: 'update:visible', value: boolean): void;
  (event: 'success'): void;
}>();

const submitting = ref(false);
const userOptions = ref<Array<{ label: string; value: string }>>([]);
const houseOptions = ref<Array<{ label: string; value: string }>>([]);
const householdGroupOptions = ref<Array<{ label: string; value: string }>>([]);
const lastHouseId = ref('');
const form = reactive({
  userId: '',
  houseId: '',
  householdGroupId: '',
  relationType: 'FAMILY_MEMBER',
  relationLabel: '',
  isPrimaryRole: false,
  canViewBill: false,
  canPayBill: false,
  canActAsAgent: false,
  canJoinConsultation: false,
  canBeVoteDelegate: false,
  status: 'ACTIVE',
  effectiveAt: '',
  expiredAt: '',
});

const relationOptions = memberRelationOptions;
const statusOptions = computed(() => [
  { label: '待审核', value: 'PENDING' },
  { label: '有效', value: 'ACTIVE' },
  { label: '已驳回', value: 'REJECTED' },
  { label: '无效', value: 'INACTIVE' },
  { label: '已过期', value: 'EXPIRED' },
  { label: '已移除', value: 'REMOVED' },
]);

function handleVisibleChange(value: boolean) {
  emit('update:visible', value);
}

function syncForm() {
  form.userId = props.initialValue?.userId ?? '';
  form.houseId = props.initialValue?.houseId ?? '';
  form.householdGroupId = props.initialValue?.householdGroupId ?? '';
  form.relationType = props.initialValue?.relationType ?? 'FAMILY_MEMBER';
  form.relationLabel = props.initialValue?.relationLabel ?? '';
  form.isPrimaryRole = props.initialValue?.isPrimaryRole ?? false;
  form.canViewBill = props.initialValue?.canViewBill ?? false;
  form.canPayBill = props.initialValue?.canPayBill ?? false;
  form.canActAsAgent = props.initialValue?.canActAsAgent ?? false;
  form.canJoinConsultation = props.initialValue?.canJoinConsultation ?? false;
  form.canBeVoteDelegate = props.initialValue?.canBeVoteDelegate ?? false;
  form.status = props.initialValue?.status ?? 'ACTIVE';
  form.effectiveAt = toDateInputValue(props.initialValue?.effectiveAt);
  form.expiredAt = toDateInputValue(props.initialValue?.expiredAt);
  lastHouseId.value = form.houseId;
}

async function loadBaseOptions() {
  const [userResult, houseResult] = await Promise.all([
    fetchUserList({ page: 1, pageSize: 100 }),
    fetchHouseList({ page: 1, pageSize: 100 }),
  ]);

  userOptions.value = userResult.items.map((item) => ({
    label: `${item.realName} / ${item.nickname} / ${item.mobile ?? '未绑定手机号'}`,
    value: item.id,
  }));

  houseOptions.value = houseResult.items.map((item) => ({
    label: `${item.communityName} / ${item.buildingName} / ${item.displayName}`,
    value: item.id,
  }));

  if (props.initialValue && !userOptions.value.some((item) => item.value === props.initialValue?.userId)) {
    userOptions.value.unshift({
      label: `${props.initialValue.userName} / ${props.initialValue.mobile ?? '未绑定手机号'}`,
      value: props.initialValue.userId,
    });
  }

  if (props.initialValue && !houseOptions.value.some((item) => item.value === props.initialValue?.houseId)) {
    houseOptions.value.unshift({
      label: props.initialValue.houseDisplayName,
      value: props.initialValue.houseId,
    });
  }
}

async function loadHouseholdGroups(houseId: string) {
  if (!houseId) {
    householdGroupOptions.value = [];
    return;
  }

  const detail = await fetchHouseDetail(houseId);
  householdGroupOptions.value = detail.householdGroups.map((item) => ({
    label: `${item.groupTypeLabel} / ${item.status}`,
    value: item.id,
  }));
}

async function submit() {
  if (!form.userId) {
    MessagePlugin.warning('请选择用户');
    return;
  }
  if (!form.houseId) {
    MessagePlugin.warning('请选择房屋');
    return;
  }
  if (!form.householdGroupId) {
    MessagePlugin.warning('请选择住户组');
    return;
  }
  if (!form.relationType) {
    MessagePlugin.warning('请选择关系类型');
    return;
  }

  submitting.value = true;
  try {
    const payload: CreateAdminMemberPayload = {
      userId: form.userId,
      houseId: form.houseId,
      householdGroupId: form.householdGroupId,
      relationType: form.relationType as CreateAdminMemberPayload['relationType'],
      relationLabel: form.relationLabel.trim() || undefined,
      isPrimaryRole: form.isPrimaryRole,
      canViewBill: form.canViewBill,
      canPayBill: form.canPayBill,
      canActAsAgent: form.canActAsAgent,
      canJoinConsultation: form.canJoinConsultation,
      canBeVoteDelegate: form.canBeVoteDelegate,
      status: form.status as CreateAdminMemberPayload['status'],
      effectiveAt: form.effectiveAt || undefined,
      expiredAt: form.expiredAt || (props.mode === 'edit' ? null : undefined),
    };

    if (props.mode === 'create') {
      await createMember(payload);
      MessagePlugin.success('成员关系创建成功');
    } else if (props.initialValue?.id) {
      await updateMember(props.initialValue.id, payload);
      MessagePlugin.success('成员关系更新成功');
    }

    emit('success');
    emit('update:visible', false);
  } finally {
    submitting.value = false;
  }
}

watch(
  () => props.visible,
  async (visible) => {
    if (!visible) {
      return;
    }

    syncForm();
    await loadBaseOptions();
    await loadHouseholdGroups(form.houseId);
  },
  { immediate: true },
);

watch(
  () => form.houseId,
  async (houseId) => {
    if (!props.visible) {
      return;
    }

    await loadHouseholdGroups(houseId);

    if (houseId !== lastHouseId.value) {
      const stillExists = householdGroupOptions.value.some((item) => item.value === form.householdGroupId);
      if (!stillExists) {
        form.householdGroupId = '';
      }
      lastHouseId.value = houseId;
    }
  },
);
</script>

<style scoped>
.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.field-label {
  font-size: 14px;
  font-weight: 600;
  color: #334155;
}

.field-label.required::after {
  content: ' *';
  color: #d54941;
}

.checkbox-section {
  margin-top: 20px;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.section-title {
  grid-column: 1 / -1;
  font-weight: 600;
  color: #334155;
}

.checkbox-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 10px;
  background: #f8fafc;
}

.native-input {
  width: 100%;
  min-height: 32px;
  padding: 6px 10px;
  border: 1px solid #d7e3f0;
  border-radius: 6px;
  font: inherit;
}

@media (max-width: 768px) {
  .form-grid,
  .checkbox-section {
    grid-template-columns: 1fr;
  }
}
</style>
