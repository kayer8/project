<template>
  <t-dialog
    :visible="visible"
    :header="mode === 'create' ? '新建用户' : '编辑用户'"
    :confirm-loading="submitting"
    width="720px"
    @update:visible="handleVisibleChange"
    @confirm="submit"
  >
    <div class="form-grid">
      <div class="field">
        <div class="field-label required">微信 OpenID</div>
        <t-input v-model="form.wechatOpenid" placeholder="请输入微信 OpenID" />
      </div>
      <div class="field">
        <div class="field-label">微信 UnionID</div>
        <t-input v-model="form.wechatUnionid" placeholder="可选" />
      </div>
      <div class="field">
        <div class="field-label">真实姓名</div>
        <t-input v-model="form.realName" placeholder="请输入真实姓名" />
      </div>
      <div class="field">
        <div class="field-label">昵称</div>
        <t-input v-model="form.nickname" placeholder="请输入昵称" />
      </div>
      <div class="field">
        <div class="field-label">手机号</div>
        <t-input v-model="form.mobile" placeholder="请输入手机号" />
      </div>
      <div class="field">
        <div class="field-label">账号状态</div>
        <t-select v-model="form.status" :options="statusOptions" />
      </div>
    </div>
  </t-dialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { MessagePlugin } from 'tdesign-vue-next';
import { createUser, updateUser } from '@/modules/user/api';
import type {
  CreateAdminUserPayload,
  UpdateAdminUserPayload,
  UserDetail,
} from '@/modules/user/types';
import { userStatusOptions } from '@/modules/user/types';

const props = defineProps<{
  visible: boolean;
  mode: 'create' | 'edit';
  initialValue?: UserDetail | null;
}>();

const emit = defineEmits<{
  (event: 'update:visible', value: boolean): void;
  (event: 'success'): void;
}>();

const submitting = ref(false);
const statusOptions = computed(() => userStatusOptions.filter((item) => item.value !== 'ALL'));
const form = reactive({
  wechatOpenid: '',
  wechatUnionid: '',
  realName: '',
  nickname: '',
  mobile: '',
  status: 'ACTIVE',
});

function normalizeOptional(value: string, keepEmptyString = false) {
  const normalized = value.trim();
  if (!normalized && !keepEmptyString) {
    return undefined;
  }
  return normalized;
}

function syncForm() {
  form.wechatOpenid = props.initialValue?.wechatOpenid ?? '';
  form.wechatUnionid = props.initialValue?.wechatUnionid ?? '';
  form.realName = props.initialValue?.realName ?? '';
  form.nickname = props.initialValue?.nickname ?? '';
  form.mobile = props.initialValue?.mobile ?? '';
  form.status = props.initialValue?.status ?? 'ACTIVE';
}

function handleVisibleChange(value: boolean) {
  emit('update:visible', value);
}

async function submit() {
  if (!form.wechatOpenid.trim()) {
    MessagePlugin.warning('微信 OpenID 不能为空');
    return;
  }

  submitting.value = true;
  try {
    const keepEmpty = props.mode === 'edit';
    const payload: UpdateAdminUserPayload = {
      wechatOpenid: form.wechatOpenid.trim(),
      wechatUnionid: normalizeOptional(form.wechatUnionid, keepEmpty),
      realName: normalizeOptional(form.realName, keepEmpty),
      nickname: normalizeOptional(form.nickname, keepEmpty),
      mobile: normalizeOptional(form.mobile, keepEmpty),
      status: form.status as UpdateAdminUserPayload['status'],
    };

    if (props.mode === 'create') {
      await createUser(payload as CreateAdminUserPayload);
      MessagePlugin.success('用户创建成功');
    } else if (props.initialValue?.id) {
      await updateUser(props.initialValue.id, payload);
      MessagePlugin.success('用户更新成功');
    }

    emit('success');
    emit('update:visible', false);
  } finally {
    submitting.value = false;
  }
}

watch(
  () => [props.visible, props.initialValue, props.mode],
  ([visible]) => {
    if (visible) {
      syncForm();
    }
  },
  { immediate: true },
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

@media (max-width: 768px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
