<template>
  <PageContainer :title="isCreate ? 'New Copy Template' : 'Edit Copy Template'">
    <t-card>
      <t-form class="form" label-align="top">
        <t-form-item label="Type" required>
          <t-select v-model="form.type" :options="copyTemplateTypeOptions" />
        </t-form-item>
        <t-form-item label="Content" required>
          <t-textarea v-model="form.content" :autosize="{ minRows: 3 }" placeholder="<= 80 characters" />
        </t-form-item>
        <t-form-item label="Trace condition">
          <t-select v-model="form.trace" clearable :options="traceOptions" />
        </t-form-item>
        <t-form-item label="Mood condition">
          <t-select v-model="form.mood" clearable :options="moodOptions" />
        </t-form-item>
        <t-form-item label="Direction condition">
          <t-select v-model="form.direction" clearable :options="directionOptions" />
        </t-form-item>
        <t-form-item label="Weight">
          <t-input-number v-model="form.weight" :min="0.1" :max="3" :step="0.1" />
        </t-form-item>
        <t-form-item label="Enable">
          <t-switch v-model="form.enabled" />
        </t-form-item>
        <div v-if="poolWarning" class="warning">
          Enabled templates for this type are below 3. Consider adding more copies.
        </div>
      </t-form>
    </t-card>

    <div class="form-actions">
      <t-space>
        <t-button variant="outline" @click="handleSave">Save</t-button>
        <t-button theme="primary" @click="handleSaveEnable">Save & Enable</t-button>
        <t-button variant="outline" @click="openPreview">Preview</t-button>
        <t-button variant="text" @click="handleCancel">Cancel</t-button>
      </t-space>
    </div>

    <t-dialog v-model:visible="previewVisible" header="Preview" :footer="false">
      <div class="preview-card">
        <div class="preview-title">{{ previewTitle }}</div>
        <div class="preview-text">{{ form.content || 'No content yet.' }}</div>
      </div>
    </t-dialog>
  </PageContainer>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { MessagePlugin } from 'tdesign-vue-next';
import PageContainer from '@/components/PageContainer/index.vue';
import {
  copyTemplateTypeOptions,
  traceOptions,
  moodOptions,
  directionOptions,
} from '@/modules/common/options';
import { fetchCopyTemplateById, fetchCopyTemplates } from '@/modules/copy-templates/api';
import type { CopyTemplateType } from '@/modules/copy-templates/types';

const router = useRouter();
const route = useRoute();

const isCreate = computed(() => route.params.id === undefined);

const form = reactive({
  type: 'task_complete' as CopyTemplateType,
  content: '',
  trace: '',
  mood: '',
  direction: '',
  weight: 1,
  enabled: true,
});

const previewVisible = ref(false);
const enabledCount = ref(0);

const previewTitle = computed(() =>
  copyTemplateTypeOptions.find((option) => option.value === form.type)?.label || 'Preview',
);

const poolWarning = computed(() => enabledCount.value < 3);

const openPreview = () => {
  previewVisible.value = true;
};

const validate = () => {
  if (!form.content.trim()) {
    MessagePlugin.error('Content is required.');
    return false;
  }
  if (form.content.length > 80) {
    MessagePlugin.error('Content must be 80 characters or less.');
    return false;
  }
  return true;
};

const handleSave = () => {
  if (!validate()) return;
  MessagePlugin.success('Saved (mock).');
};

const handleSaveEnable = () => {
  if (!validate()) return;
  MessagePlugin.success('Saved and enabled (mock).');
};

const handleCancel = () => {
  router.back();
};

const updateEnabledCount = async () => {
  const list = await fetchCopyTemplates();
  enabledCount.value = list.filter(
    (item) => item.type === form.type && item.status === 'enabled',
  ).length;
};

onMounted(async () => {
  const id = route.params.id as string | undefined;
  if (id) {
    const detail = await fetchCopyTemplateById(id);
    if (detail) {
      form.type = detail.type;
      form.content = detail.content;
      form.trace = detail.conditions?.trace || '';
      form.mood = detail.conditions?.mood || '';
      form.direction = detail.conditions?.direction || '';
      form.weight = detail.weight || 1;
      form.enabled = detail.status === 'enabled';
    }
  }
  await updateEnabledCount();
});

watch(
  () => form.type,
  () => {
    void updateEnabledCount();
  },
);
</script>

<style scoped>
.form {
  max-width: 640px;
}

.form-actions {
  margin-top: 16px;
}

.warning {
  padding: 10px 12px;
  border-radius: 6px;
  background: #fff5e6;
  color: #a15c00;
  font-size: 13px;
  margin-top: 12px;
}

.preview-card {
  border-radius: 12px;
  padding: 16px;
  background: #f6f7fb;
  border: 1px solid #e6e8f0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.preview-title {
  font-weight: 600;
}

.preview-text {
  color: #4f5565;
}
</style>
