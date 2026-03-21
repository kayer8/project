<template>
  <t-dialog
    :visible="visible"
    :header="mode === 'create' ? '新建投票' : '编辑投票'"
    :confirm-loading="submitting"
    width="720px"
    @update:visible="handleVisibleChange"
    @confirm="submit"
  >
    <div class="form-grid">
      <div class="field field--full">
        <div class="field-label required">投票标题</div>
        <t-input v-model="form.title" placeholder="请输入投票标题" />
      </div>

      <div class="field">
        <div class="field-label required">投票类型</div>
        <t-select v-model="form.type" :options="typeSelectOptions" />
      </div>

      <div class="field">
        <div class="field-label required">发起方</div>
        <t-input v-model="form.sponsor" placeholder="例如业委会秘书处" />
      </div>

      <div class="field field--full">
        <div class="field-label">投票说明</div>
        <t-textarea
          v-model="form.description"
          :maxlength="500"
          placeholder="可补充投票背景、用途或说明"
        />
      </div>

      <div class="field field--full">
        <div class="field-label required">投票选项</div>
        <div class="option-list">
          <div v-for="(option, index) in form.options" :key="index" class="option-row">
            <span class="option-row__index">{{ index + 1 }}</span>
            <t-input v-model="option.optionText" :placeholder="`请输入选项 ${index + 1}`" />
            <t-button
              variant="outline"
              theme="danger"
              :disabled="form.options.length <= 2"
              @click="removeOption(index)"
            >
              删除
            </t-button>
          </div>
          <t-button variant="outline" class="option-list__add" @click="addOption">新增选项</t-button>
        </div>
      </div>

      <template v-if="mode === 'edit'">
        <div class="field">
          <div class="field-label">总户数</div>
          <t-input :model-value="String(form.totalHouseholds)" readonly />
        </div>
        <div class="field">
          <div class="field-label">已参与户数</div>
          <t-input-number v-model="form.participantCount" theme="normal" :min="0" />
        </div>
        <div class="field">
          <div class="field-label">通过率</div>
          <t-input-number v-model="form.passRate" theme="normal" :min="0" :max="100" />
        </div>
        <div class="field">
          <div class="field-label">结果</div>
          <t-select v-model="form.result" :options="resultSelectOptions" />
        </div>
      </template>

      <div class="field">
        <div class="field-label">参与范围</div>
        <t-select
          v-model="form.scopeBuildingIds"
          :options="buildingSelectOptions"
          multiple
          filterable
          clearable
          placeholder="不选楼栋时默认按全体范围"
        />
        <div class="scope-panel__summary">默认人群：{{ audienceLabel }}</div>
        <div class="scope-panel__summary">当前范围：{{ selectedScopeLabel }}</div>
        <div class="scope-panel__summary">
          总户数：{{ scopeSummaryLoading ? '计算中...' : form.totalHouseholds }}
          <span v-if="!scopeSummaryLoading">
            ，{{ authenticatedUserLabel }}：{{ scopeSummary?.authenticatedUserCount ?? 0 }}
          </span>
        </div>
      </div>

      <div class="field">
        <div class="field-label">截止日期</div>
        <t-date-picker
          v-model="form.deadline"
          clearable
          format="YYYY-MM-DD"
          value-type="YYYY-MM-DD"
          placeholder="可选，不填则不限制截止日期"
        />
      </div>
    </div>
  </t-dialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { MessagePlugin } from 'tdesign-vue-next';
import { fetchBuildingOptions } from '@/modules/building/api';
import type { BuildingOption } from '@/modules/building/types';
import { createVote, fetchVoteScopeSummary, updateVote } from '@/modules/vote/api';
import type {
  CreateAdminVotePayload,
  UpdateAdminVotePayload,
  VoteItem,
  VoteScopeSummary,
  VoteType,
} from '@/modules/vote/types';
import { voteResultOptions, voteTypeOptions } from '@/modules/vote/types';

const props = defineProps<{
  visible: boolean;
  mode: 'create' | 'edit';
  initialValue?: VoteItem | null;
}>();

const emit = defineEmits<{
  (event: 'update:visible', value: boolean): void;
  (event: 'success'): void;
}>();

const submitting = ref(false);
const buildingOptions = ref<BuildingOption[]>([]);
const scopeSummary = ref<VoteScopeSummary | null>(null);
const scopeSummaryLoading = ref(false);

const form = reactive({
  title: '',
  type: 'FORMAL',
  sponsor: '',
  scopeType: 'ALL',
  scopeBuildingIds: [] as string[],
  options: [{ optionText: '' }, { optionText: '' }],
  deadline: '',
  totalHouseholds: 0,
  participantCount: 0,
  passRate: 0,
  result: 'PENDING',
  description: '',
});

const typeSelectOptions = computed(() => voteTypeOptions.filter((item) => item.value !== 'ALL'));
const resultSelectOptions = computed(() => voteResultOptions.filter((item) => item.value !== 'ALL'));
const activeBuildingOptions = computed(() =>
  buildingOptions.value.filter((item) => item.status === 'ACTIVE'),
);
const buildingSelectOptions = computed(() =>
  activeBuildingOptions.value.map((item) => ({
    label: item.buildingName,
    value: item.id,
  })),
);
const audienceLabel = computed(() => (form.type === 'FORMAL' ? '全体业主' : '全部住户'));
const authenticatedUserLabel = computed(() =>
  form.type === 'FORMAL' ? '已认证业主用户数' : '已认证住户用户数',
);
const selectedScopeLabel = computed(() => scopeSummary.value?.scope || audienceLabel.value);

function handleVisibleChange(value: boolean) {
  emit('update:visible', value);
}

function syncForm() {
  form.title = props.initialValue?.title ?? '';
  form.type = (props.initialValue?.type ?? 'FORMAL') as VoteType;
  form.sponsor = props.initialValue?.sponsor ?? '';
  form.scopeType = props.initialValue?.scopeType ?? 'ALL';
  form.scopeBuildingIds = props.initialValue?.scopeBuildingIds ?? [];
  form.options = props.initialValue?.options?.length
    ? props.initialValue.options.map((item) => ({ optionText: item.optionText }))
    : [{ optionText: '' }, { optionText: '' }];
  form.deadline = props.initialValue?.deadline ? String(props.initialValue.deadline).slice(0, 10) : '';
  form.totalHouseholds = props.initialValue?.totalHouseholds ?? 0;
  form.participantCount = props.initialValue?.participantCount ?? 0;
  form.passRate = props.initialValue?.passRate ?? 0;
  form.result = props.initialValue?.result ?? 'PENDING';
  form.description = props.initialValue?.description ?? '';
}

async function ensureBuildingOptionsLoaded() {
  if (buildingOptions.value.length > 0) {
    return;
  }

  buildingOptions.value = await fetchBuildingOptions();
}

async function loadScopeSummary() {
  form.scopeType = form.scopeBuildingIds.length > 0 ? 'BUILDING' : 'ALL';

  scopeSummaryLoading.value = true;
  try {
    const result = await fetchVoteScopeSummary({
      type: form.type,
      scopeType: form.scopeType,
      scopeBuildingIds:
        form.scopeType === 'BUILDING' ? form.scopeBuildingIds.join(',') : undefined,
    });
    scopeSummary.value = result;
    form.totalHouseholds = result.totalHouseholds;
  } finally {
    scopeSummaryLoading.value = false;
  }
}

function addOption() {
  form.options.push({ optionText: '' });
}

function removeOption(index: number) {
  if (form.options.length <= 2) {
    return;
  }

  form.options.splice(index, 1);
}

async function submit() {
  if (!form.title.trim()) {
    MessagePlugin.warning('投票标题不能为空');
    return;
  }

  if (!form.sponsor.trim()) {
    MessagePlugin.warning('发起方不能为空');
    return;
  }

  const normalizedOptions = form.options
    .map((item) => item.optionText.trim())
    .filter((item) => item);
  if (normalizedOptions.length < 2) {
    MessagePlugin.warning('请至少填写 2 个有效选项');
    return;
  }

  if (form.totalHouseholds > 0 && form.participantCount > form.totalHouseholds) {
    MessagePlugin.warning('已参与户数不能大于总户数');
    return;
  }

  submitting.value = true;
  try {
    const payload: UpdateAdminVotePayload = {
      title: form.title.trim(),
      type: form.type as CreateAdminVotePayload['type'],
      sponsor: form.sponsor.trim(),
      scopeType: form.scopeBuildingIds.length > 0 ? 'BUILDING' : 'ALL',
      scopeBuildingIds: form.scopeBuildingIds.length > 0 ? form.scopeBuildingIds : undefined,
      options: normalizedOptions.map((optionText) => ({ optionText })),
      deadline: form.deadline || undefined,
      participantCount: Number(form.participantCount || 0),
      passRate: Number(form.passRate || 0),
      result: form.result as CreateAdminVotePayload['result'],
      description: form.description.trim() || undefined,
    };

    if (props.mode === 'create') {
      await createVote(payload as CreateAdminVotePayload);
      MessagePlugin.success('投票创建成功');
    } else if (props.initialValue?.id) {
      await updateVote(props.initialValue.id, payload);
      MessagePlugin.success('投票更新成功');
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

    await ensureBuildingOptionsLoaded();
    syncForm();
    await loadScopeSummary();
  },
  { immediate: true },
);

watch(
  () => form.type,
  async () => {
    await loadScopeSummary();
  },
);

watch(
  () => form.scopeBuildingIds.join(','),
  async () => {
    await loadScopeSummary();
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

.scope-panel__summary {
  font-size: 13px;
  color: #64748b;
}

.option-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.option-row {
  display: grid;
  grid-template-columns: 32px minmax(0, 1fr) auto;
  gap: 12px;
  align-items: center;
}

.option-row__index {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 999px;
  background: #e2e8f0;
  color: #334155;
  font-size: 12px;
  font-weight: 600;
}

.option-list__add {
  align-self: flex-start;
}

@media (max-width: 768px) {
  .form-grid {
    grid-template-columns: 1fr;
  }

  .option-row {
    grid-template-columns: 1fr;
  }
}
</style>
