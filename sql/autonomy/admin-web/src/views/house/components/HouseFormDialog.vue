<template>
  <t-dialog
    :visible="visible"
    :header="mode === 'create' ? '新建房屋' : '编辑房屋'"
    :confirm-loading="submitting"
    width="760px"
    @update:visible="handleVisibleChange"
    @confirm="submit"
  >
    <div class="form-grid">
      <div class="field">
        <div class="field-label required">所属社区</div>
        <t-select v-model="form.communityId" :options="communitySelectOptions" placeholder="请选择社区" />
      </div>
      <div class="field">
        <div class="field-label required">所属楼栋</div>
        <t-select v-model="form.buildingId" :options="buildingSelectOptions" placeholder="请选择楼栋" />
      </div>
      <div class="field">
        <div class="field-label">单元号</div>
        <t-input v-model="form.unitNo" placeholder="如 1 单元" />
      </div>
      <div class="field">
        <div class="field-label">楼层号</div>
        <t-input v-model="form.floorNo" placeholder="如 12" />
      </div>
      <div class="field">
        <div class="field-label required">房号</div>
        <t-input v-model="form.roomNo" placeholder="如 1201" />
      </div>
      <div class="field">
        <div class="field-label required">展示名称</div>
        <t-input v-model="form.displayName" placeholder="如 1 栋 1 单元 1201" />
      </div>
      <div class="field">
        <div class="field-label">房屋状态</div>
        <t-select v-model="form.houseStatus" :options="houseStatusSelectOptions" />
      </div>
      <div class="field">
        <div class="field-label">建筑面积</div>
        <t-input v-model="form.grossArea" placeholder="单位：㎡" />
      </div>
    </div>
  </t-dialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { MessagePlugin } from 'tdesign-vue-next';
import {
  createHouse,
  fetchBuildingOptions,
  fetchCommunityOptions,
  updateHouse,
} from '@/modules/house/api';
import type {
  BuildingOption,
  CommunityOption,
  CreateAdminHousePayload,
  HouseDetail,
  UpdateAdminHousePayload,
} from '@/modules/house/types';
import { houseStatusOptions } from '@/modules/house/types';

const props = defineProps<{
  visible: boolean;
  mode: 'create' | 'edit';
  initialValue?: HouseDetail | null;
}>();

const emit = defineEmits<{
  (event: 'update:visible', value: boolean): void;
  (event: 'success'): void;
}>();

const submitting = ref(false);
const communities = ref<CommunityOption[]>([]);
const buildings = ref<BuildingOption[]>([]);
const lastCommunityId = ref('');
const form = reactive({
  communityId: '',
  buildingId: '',
  unitNo: '',
  floorNo: '',
  roomNo: '',
  displayName: '',
  houseStatus: 'SELF_OCCUPIED',
  grossArea: '',
});

const houseStatusSelectOptions = computed(() =>
  houseStatusOptions.filter((item) => item.value !== 'ALL'),
);
const communitySelectOptions = computed(() =>
  communities.value.map((item) => ({
    label: item.name,
    value: item.id,
  })),
);
const buildingSelectOptions = computed(() =>
  buildings.value.map((item) => ({
    label: `${item.buildingName} (${item.buildingCode})`,
    value: item.id,
  })),
);

function handleVisibleChange(value: boolean) {
  emit('update:visible', value);
}

function parseOptionalNumber(value: string, clearAsNull = false) {
  const normalized = value.trim();
  if (!normalized) {
    return clearAsNull ? null : undefined;
  }

  const parsed = Number(normalized);
  return Number.isNaN(parsed) ? undefined : parsed;
}

function syncForm() {
  form.communityId = props.initialValue?.communityId ?? '';
  form.buildingId = props.initialValue?.buildingId ?? '';
  form.unitNo = props.initialValue?.unitNo ?? '';
  form.floorNo =
    props.initialValue?.floorNo === null || props.initialValue?.floorNo === undefined
      ? ''
      : String(props.initialValue.floorNo);
  form.roomNo = props.initialValue?.roomNo ?? '';
  form.displayName = props.initialValue?.displayName ?? '';
  form.houseStatus = props.initialValue?.houseStatus ?? 'SELF_OCCUPIED';
  form.grossArea =
    props.initialValue?.grossArea === null || props.initialValue?.grossArea === undefined
      ? ''
      : String(props.initialValue.grossArea);
  lastCommunityId.value = form.communityId;
}

async function loadCommunities() {
  communities.value = await fetchCommunityOptions();
}

async function loadBuildings(communityId?: string) {
  buildings.value = await fetchBuildingOptions(communityId || undefined);
}

async function initializeOptions() {
  await loadCommunities();
  await loadBuildings(form.communityId || undefined);
}

async function submit() {
  if (!form.communityId) {
    MessagePlugin.warning('请选择社区');
    return;
  }
  if (!form.buildingId) {
    MessagePlugin.warning('请选择楼栋');
    return;
  }
  if (!form.roomNo.trim()) {
    MessagePlugin.warning('房号不能为空');
    return;
  }
  if (!form.displayName.trim()) {
    MessagePlugin.warning('展示名称不能为空');
    return;
  }

  submitting.value = true;
  try {
    const isEdit = props.mode === 'edit';
    const payload: UpdateAdminHousePayload = {
      communityId: form.communityId,
      buildingId: form.buildingId,
      unitNo: form.unitNo.trim(),
      floorNo: parseOptionalNumber(form.floorNo, isEdit),
      roomNo: form.roomNo.trim(),
      displayName: form.displayName.trim(),
      houseStatus: form.houseStatus as UpdateAdminHousePayload['houseStatus'],
      grossArea: parseOptionalNumber(form.grossArea, isEdit),
    };

    if (props.mode === 'create') {
      await createHouse(payload as CreateAdminHousePayload);
      MessagePlugin.success('房屋创建成功');
    } else if (props.initialValue?.id) {
      await updateHouse(props.initialValue.id, payload);
      MessagePlugin.success('房屋更新成功');
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
    await initializeOptions();
  },
  { immediate: true },
);

watch(
  () => form.communityId,
  async (communityId) => {
    if (!props.visible || !communityId) {
      return;
    }

    await loadBuildings(communityId);

    if (communityId !== lastCommunityId.value) {
      const stillExists = buildings.value.some((item) => item.id === form.buildingId);
      if (!stillExists) {
        form.buildingId = '';
      }
      lastCommunityId.value = communityId;
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

@media (max-width: 768px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
