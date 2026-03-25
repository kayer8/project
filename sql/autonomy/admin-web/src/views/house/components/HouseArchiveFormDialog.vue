<template>
  <t-dialog
    :visible="visible"
    :header="mode === 'create' ? '新增预绑定手机号' : '编辑预绑定手机号'"
    :confirm-loading="submitting"
    width="640px"
    @update:visible="handleVisibleChange"
    @confirm="submit"
  >
    <div class="form-grid">
      <div class="field">
        <div class="field-label required">手机号</div>
        <t-input v-model="form.mobile" placeholder="请输入手机号" />
      </div>
      <div class="field">
        <div class="field-label">业主姓名</div>
        <t-input v-model="form.realName" placeholder="可选" />
      </div>
      <div class="field">
        <div class="field-label">关系类型</div>
        <t-select v-model="form.relationType" :options="relationTypeOptions" />
      </div>
      <div class="field">
        <div class="field-label">关系标签</div>
        <t-input v-model="form.relationLabel" placeholder="可选，如业主本人" />
      </div>
      <div class="field field--full">
        <div class="field-label">备注</div>
        <t-textarea v-model="form.remark" :autosize="{ minRows: 2, maxRows: 4 }" placeholder="可选" />
      </div>
    </div>
  </t-dialog>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from 'vue';
import { MessagePlugin } from 'tdesign-vue-next';
import { createHouseArchive, updateHouseArchive } from '@/modules/house/api';
import type {
  CreateHouseResidentArchivePayload,
  HouseResidentArchiveItem,
  UpdateHouseResidentArchivePayload,
} from '@/modules/house/types';

const relationTypeOptions = [
  { label: '业主', value: 'MAIN_OWNER' },
  { label: '家庭成员', value: 'FAMILY_MEMBER' },
  { label: '租户', value: 'MAIN_TENANT' },
  { label: '同住成员', value: 'CO_RESIDENT' },
  { label: '代理人', value: 'AGENT' },
];

const props = defineProps<{
  visible: boolean;
  houseId: string;
  mode: 'create' | 'edit';
  initialValue?: HouseResidentArchiveItem | null;
}>();

const emit = defineEmits<{
  (event: 'update:visible', value: boolean): void;
  (event: 'success'): void;
}>();

const submitting = ref(false);
const form = reactive({
  mobile: '',
  realName: '',
  relationType: 'MAIN_OWNER',
  relationLabel: '',
  remark: '',
});

function normalizeOptional(value: string) {
  const normalized = value.trim();
  return normalized || undefined;
}

function handleVisibleChange(value: boolean) {
  emit('update:visible', value);
}

function syncForm() {
  form.mobile = props.initialValue?.mobile ?? '';
  form.realName = props.initialValue?.realName ?? '';
  form.relationType = props.initialValue?.relationType ?? 'MAIN_OWNER';
  form.relationLabel = props.initialValue?.relationLabel ?? '';
  form.remark = props.initialValue?.remark ?? '';
}

async function submit() {
  if (!form.mobile.trim()) {
    MessagePlugin.warning('手机号不能为空');
    return;
  }

  if (!props.houseId) {
    MessagePlugin.error('当前房屋信息无效');
    return;
  }

  submitting.value = true;
  try {
    const payload: UpdateHouseResidentArchivePayload = {
      mobile: form.mobile.trim(),
      realName: normalizeOptional(form.realName),
      relationType: form.relationType,
      relationLabel: normalizeOptional(form.relationLabel),
      remark: normalizeOptional(form.remark),
    };

    if (props.mode === 'create') {
      await createHouseArchive(props.houseId, payload as CreateHouseResidentArchivePayload);
      MessagePlugin.success('预绑定手机号已新增');
    } else if (props.initialValue?.id) {
      await updateHouseArchive(props.houseId, props.initialValue.id, payload);
      MessagePlugin.success('预绑定手机号已更新');
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

.field--full {
  grid-column: 1 / -1;
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
