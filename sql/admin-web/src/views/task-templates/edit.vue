<template>
  <PageContainer :title="isCreate ? 'New Task Template' : 'Edit Task Template'">
    <t-card>
      <t-form class="form" label-align="top">
        <t-form-item label="Title" required>
          <t-input v-model="form.title" placeholder="<= 20 characters" />
        </t-form-item>
        <t-form-item label="Description" required>
          <t-textarea v-model="form.description" placeholder="<= 200 characters" :autosize="{ minRows: 3 }" />
        </t-form-item>
        <t-form-item label="Type" required>
          <t-select v-model="form.type" :options="taskTypeOptions" />
        </t-form-item>
        <t-form-item v-if="form.type === 'timer'" label="Default Duration (seconds)" required>
          <t-input-number v-model="form.defaultDuration" :min="30" :max="600" />
        </t-form-item>
        <t-form-item v-if="form.type === 'steps'" label="Steps" required>
          <StepsEditor v-model="form.steps" />
        </t-form-item>
        <t-form-item label="Difficulty" required>
          <t-select v-model="form.difficulty" :options="difficultyOptions" />
        </t-form-item>
        <t-form-item label="Moods">
          <t-select v-model="form.moods" multiple clearable :options="moodOptions" />
        </t-form-item>
        <t-form-item label="Direction tags" required>
          <t-select v-model="form.directions" multiple clearable :options="directionOptions" />
        </t-form-item>
        <t-form-item label="Trace tags" required>
          <t-select v-model="form.traces" multiple clearable :options="traceOptions" />
        </t-form-item>
        <t-form-item label="Visible after publish">
          <t-switch v-model="form.visibleAfterPublish" />
        </t-form-item>
      </t-form>
    </t-card>

    <div class="form-actions">
      <t-space>
        <t-button variant="outline" @click="handleSaveDraft">Save Draft</t-button>
        <t-button theme="primary" @click="handleSavePublish">Save & Publish</t-button>
        <t-button variant="outline" @click="openPreview">Preview</t-button>
        <t-button variant="text" @click="handleCancel">Cancel</t-button>
      </t-space>
    </div>

    <t-dialog v-model:visible="previewVisible" header="Preview" :footer="false">
      <div class="preview-card">
        <div class="preview-title">{{ form.title || 'Untitled task' }}</div>
        <div class="preview-desc">{{ form.description || 'No description yet.' }}</div>
        <div v-if="form.type === 'steps'" class="preview-steps">
          <div v-for="(step, index) in form.steps" :key="`step-${index}`" class="preview-step">
            {{ index + 1 }}. {{ step || 'Empty step' }}
          </div>
        </div>
        <div v-if="form.type === 'timer'" class="preview-timer">
          <t-button theme="primary" size="small">Start {{ form.defaultDuration }}s</t-button>
        </div>
        <div v-if="form.type === 'free'" class="preview-free">
          <t-button variant="outline" size="small">Write now</t-button>
        </div>
      </div>
    </t-dialog>
  </PageContainer>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { MessagePlugin } from 'tdesign-vue-next';
import PageContainer from '@/components/PageContainer/index.vue';
import StepsEditor from '@/modules/task-templates/components/StepsEditor.vue';
import {
  taskTypeOptions,
  difficultyOptions,
  moodOptions,
  directionOptions,
  traceOptions,
} from '@/modules/common/options';
import { fetchTaskTemplateById } from '@/modules/task-templates/api';
import type { TaskTemplateType } from '@/modules/task-templates/types';

const router = useRouter();
const route = useRoute();

const isCreate = computed(() => route.params.id === undefined);

const form = reactive({
  title: '',
  description: '',
  type: 'timer' as TaskTemplateType,
  defaultDuration: 180,
  steps: [''],
  difficulty: 1,
  moods: [] as string[],
  directions: [] as string[],
  traces: [] as string[],
  visibleAfterPublish: true,
});

const previewVisible = ref(false);

const openPreview = () => {
  previewVisible.value = true;
};

const validateBase = () => {
  if (!form.title.trim()) {
    MessagePlugin.error('Title is required.');
    return false;
  }
  if (form.title.length > 20) {
    MessagePlugin.error('Title must be 20 characters or less.');
    return false;
  }
  if (!form.description.trim()) {
    MessagePlugin.error('Description is required.');
    return false;
  }
  if (form.description.length > 200) {
    MessagePlugin.error('Description must be 200 characters or less.');
    return false;
  }
  return true;
};

const validatePublish = () => {
  if (!validateBase()) return false;
  if (form.type === 'timer' && (form.defaultDuration < 30 || form.defaultDuration > 600)) {
    MessagePlugin.error('Timer duration must be between 30 and 600 seconds.');
    return false;
  }
  if (form.type === 'steps') {
    const validSteps = form.steps.filter((step) => step.trim());
    if (!validSteps.length) {
      MessagePlugin.error('At least one step is required.');
      return false;
    }
    if (validSteps.some((step) => step.length > 30)) {
      MessagePlugin.error('Each step must be 30 characters or less.');
      return false;
    }
  }
  if (!form.directions.length) {
    MessagePlugin.error('Select at least one direction tag.');
    return false;
  }
  if (!form.traces.length) {
    MessagePlugin.error('Select at least one trace tag.');
    return false;
  }
  if (form.traces.length > 2) {
    MessagePlugin.error('Trace tags should be limited to 2.');
    return false;
  }
  return true;
};

const handleSaveDraft = () => {
  if (!validateBase()) return;
  MessagePlugin.success('Draft saved (mock).');
};

const handleSavePublish = () => {
  if (!validatePublish()) return;
  MessagePlugin.success('Saved and published (mock).');
};

const handleCancel = () => {
  router.back();
};

onMounted(async () => {
  const id = route.params.id as string | undefined;
  if (!id) return;
  const detail = await fetchTaskTemplateById(id);
  if (!detail) return;
  form.title = detail.title;
  form.description = detail.description;
  form.type = detail.type;
  form.defaultDuration = detail.defaultDuration || 180;
  form.steps = detail.steps?.length ? [...detail.steps] : [''];
  form.difficulty = detail.difficulty;
  form.moods = [...detail.tags.moods];
  form.directions = [...detail.tags.directions];
  form.traces = [...detail.tags.traces];
});
</script>

<style scoped>
.form {
  max-width: 720px;
}

.form-actions {
  margin-top: 16px;
}

.preview-card {
  border-radius: 12px;
  padding: 16px;
  background: linear-gradient(135deg, #f5f7ff, #f1f3ff);
  border: 1px solid #dfe3ff;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.preview-title {
  font-size: 16px;
  font-weight: 600;
}

.preview-desc {
  font-size: 13px;
  color: #4f5565;
}

.preview-steps {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.preview-step {
  font-size: 13px;
  color: #2d2f33;
}

.preview-timer,
.preview-free {
  margin-top: 6px;
}
</style>
