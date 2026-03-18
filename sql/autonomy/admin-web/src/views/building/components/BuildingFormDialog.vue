<template>
  <t-dialog
    :visible="visible"
    :header="mode === 'create' ? '新建楼栋' : '编辑楼栋'"
    :confirm-loading="submitting"
    width="640px"
    @update:visible="handleVisibleChange"
    @confirm="submit"
  >
    <div class="form-grid">
      <div class="field">
        <div class="field-label required">楼栋名称</div>
        <t-input v-model="form.buildingName" placeholder="如 2栋" />
      </div>
      <div class="field">
        <div class="field-label required">楼栋编码</div>
        <t-input v-model="form.buildingCode" placeholder="如 B2" />
      </div>
      <div class="field">
        <div class="field-label">排序号</div>
        <t-input v-model="form.sortNo" placeholder="如 20" />
      </div>
      <div class="field">
        <div class="field-label">楼栋状态</div>
        <t-select v-model="form.status" :options="statusSelectOptions" />
      </div>
    </div>
  </t-dialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { MessagePlugin } from 'tdesign-vue-next';
import { createBuilding, updateBuilding } from '@/modules/building/api';
import type {
  BuildingDetail,
  CreateAdminBuildingPayload,
  UpdateAdminBuildingPayload,
} from '@/modules/building/types';
import { buildingStatusOptions } from '@/modules/building/types';

const props = defineProps<{
  visible: boolean;
  mode: 'create' | 'edit';
  initialValue?: BuildingDetail | null;
}>();

const emit = defineEmits<{
  (event: 'update:visible', value: boolean): void;
  (event: 'success'): void;
}>();

const submitting = ref(false);
const form = reactive({
  buildingName: '',
  buildingCode: '',
  sortNo: '',
  status: 'ACTIVE',
});

const statusSelectOptions = computed(() =>
  buildingStatusOptions.filter((item) => item.value !== 'ALL'),
);

function handleVisibleChange(value: boolean) {
  emit('update:visible', value);
}

function parseSortNo(value: string, clearAsNull = false) {
  const normalized = value.trim();
  if (!normalized) {
    return clearAsNull ? null : undefined;
  }

  const parsed = Number(normalized);
  return Number.isNaN(parsed) ? undefined : parsed;
}

function syncForm() {
  form.buildingName = props.initialValue?.buildingName ?? '';
  form.buildingCode = props.initialValue?.buildingCode ?? '';
  form.sortNo =
    props.initialValue?.sortNo === null || props.initialValue?.sortNo === undefined
      ? ''
      : String(props.initialValue.sortNo);
  form.status = props.initialValue?.status ?? 'ACTIVE';
}

async function submit() {
  if (!form.buildingName.trim()) {
    MessagePlugin.warning('楼栋名称不能为空');
    return;
  }

  if (!form.buildingCode.trim()) {
    MessagePlugin.warning('楼栋编码不能为空');
    return;
  }

  submitting.value = true;
  try {
    const isEdit = props.mode === 'edit';
    const payload: UpdateAdminBuildingPayload = {
      buildingName: form.buildingName.trim(),
      buildingCode: form.buildingCode.trim(),
      sortNo: parseSortNo(form.sortNo, isEdit),
      status: form.status as UpdateAdminBuildingPayload['status'],
    };

    if (props.mode === 'create') {
      await createBuilding(payload as CreateAdminBuildingPayload);
      MessagePlugin.success('楼栋创建成功');
    } else if (props.initialValue?.id) {
      await updateBuilding(props.initialValue.id, payload);
      MessagePlugin.success('楼栋更新成功');
    }

    emit('success');
    emit('update:visible', false);
  } finally {
    submitting.value = false;
  }
}

watch(
  () => props.visible,
  (visible) => {
    if (!visible) {
      return;
    }

    syncForm();
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
