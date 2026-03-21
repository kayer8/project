<template>
  <t-dialog
    :visible="visible"
    :header="mode === 'create' ? '新建内容' : '编辑内容'"
    :confirm-loading="submitting"
    width="760px"
    @update:visible="handleVisibleChange"
    @confirm="submit"
  >
    <div class="form-grid">
      <div class="field">
        <div class="field-label required">内容标题</div>
        <t-input v-model="form.title" maxlength="150" placeholder="请输入内容标题" />
      </div>
      <div class="field">
        <div class="field-label required">内容分类</div>
        <t-select v-model="form.category" :options="categorySelectOptions" placeholder="请选择内容分类" />
      </div>
      <div class="field">
        <div class="field-label required">发布单位</div>
        <t-input v-model="form.publisher" maxlength="100" placeholder="请输入发布单位" />
      </div>
      <div class="field field--full">
        <div class="field-label">摘要说明</div>
        <t-textarea
          v-model="form.summary"
          :autosize="{ minRows: 2, maxRows: 4 }"
          maxlength="255"
          placeholder="用于列表补充展示，可不填"
        />
      </div>
      <div class="field field--full">
        <div class="field-label required">正文内容</div>
        <t-textarea
          v-model="form.content"
          :autosize="{ minRows: 8, maxRows: 14 }"
          placeholder="请输入公开内容正文"
        />
      </div>
      <div class="field">
        <div class="field-label">发布时间开始</div>
        <t-date-picker
          v-model="form.publishStartAt"
          clearable
          format="YYYY-MM-DD"
          value-type="YYYY-MM-DD"
          placeholder="请选择开始日期"
        />
      </div>
      <div class="field">
        <div class="field-label">发布时间结束</div>
        <t-date-picker
          v-model="form.publishEndAt"
          clearable
          format="YYYY-MM-DD"
          value-type="YYYY-MM-DD"
          placeholder="请选择结束日期"
        />
      </div>
    </div>
  </t-dialog>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from 'vue';
import { MessagePlugin } from 'tdesign-vue-next';
import { createDisclosureContent, updateDisclosureContent } from '@/modules/disclosure/api';
import type {
  CreateAdminDisclosureContentPayload,
  DisclosureContentCategory,
  DisclosureContentItem,
  UpdateAdminDisclosureContentPayload,
} from '@/modules/disclosure/types';
import { disclosureContentCategoryOptions } from '@/modules/disclosure/types';
import { formatDate } from '@/utils/format';

const props = defineProps<{
  visible: boolean;
  mode: 'create' | 'edit';
  initialValue?: DisclosureContentItem | null;
}>();

const emit = defineEmits<{
  (event: 'update:visible', value: boolean): void;
  (event: 'success'): void;
}>();

const submitting = ref(false);
const form = reactive({
  title: '',
  category: '' as DisclosureContentCategory | '',
  publisher: '',
  summary: '',
  content: '',
  publishStartAt: '',
  publishEndAt: '',
});

const categorySelectOptions = disclosureContentCategoryOptions.filter((item) => item.value !== 'ALL');

function handleVisibleChange(value: boolean) {
  emit('update:visible', value);
}

function syncForm() {
  form.title = props.initialValue?.title ?? '';
  form.category = props.initialValue?.category ?? '';
  form.publisher = props.initialValue?.publisher ?? '';
  form.summary = props.initialValue?.summary ?? '';
  form.content = props.initialValue?.content ?? '';
  form.publishStartAt = formatDate(props.initialValue?.publishStartAt, '');
  form.publishEndAt = formatDate(props.initialValue?.publishEndAt, '');
}

async function submit() {
  if (!form.title.trim()) {
    MessagePlugin.warning('内容标题不能为空');
    return;
  }

  if (!form.category.trim()) {
    MessagePlugin.warning('内容分类不能为空');
    return;
  }

  if (!form.publisher.trim()) {
    MessagePlugin.warning('发布单位不能为空');
    return;
  }

  if (!form.content.trim()) {
    MessagePlugin.warning('正文内容不能为空');
    return;
  }

  submitting.value = true;
  try {
    const payload: UpdateAdminDisclosureContentPayload = {
      title: form.title.trim(),
      category: form.category,
      publisher: form.publisher.trim(),
      summary: form.summary.trim() || undefined,
      content: form.content.trim(),
      publishStartAt: form.publishStartAt || undefined,
      publishEndAt: form.publishEndAt || undefined,
    };

    if (props.mode === 'create') {
      await createDisclosureContent(payload as CreateAdminDisclosureContentPayload);
      MessagePlugin.success('内容创建成功');
    } else if (props.initialValue?.id) {
      await updateDisclosureContent(props.initialValue.id, payload);
      MessagePlugin.success('内容更新成功');
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
