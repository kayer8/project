<template>
  <PageContainer :title="isCreate ? '新建任务模板' : '编辑任务模板'">
    <t-card>
      <t-form class="form" label-align="top">
        <t-form-item label="标题" required>
          <t-input v-model="form.title" placeholder="最多 20 字" />
        </t-form-item>
        <t-form-item label="描述" required>
          <t-textarea v-model="form.description" placeholder="最多 200 字" :autosize="{ minRows: 3 }" />
        </t-form-item>
        <t-form-item label="类型" required>
          <t-select v-model="form.type" :options="taskTypeOptions" />
        </t-form-item>
        <t-form-item v-if="form.type === 'timer'" label="默认时长（秒）" required>
          <t-input-number v-model="form.defaultDuration" :min="30" :max="600" />
        </t-form-item>
        <t-form-item v-if="form.type === 'steps'" label="步骤" required>
          <StepsEditor v-model="form.steps" />
        </t-form-item>
        <t-form-item label="难度" required>
          <t-select v-model="form.difficulty" :options="difficultyOptions" />
        </t-form-item>
        <t-form-item label="心情标签">
          <t-select v-model="form.moods" multiple clearable :options="moodOptions" />
        </t-form-item>
        <t-form-item label="方向标签" required>
          <t-select v-model="form.directions" multiple clearable :options="directionOptions" />
        </t-form-item>
        <t-form-item label="追踪标签" required>
          <t-select v-model="form.traces" multiple clearable :options="traceOptions" />
        </t-form-item>
        <t-form-item label="上架后可见">
          <t-switch v-model="form.visibleAfterPublish" />
        </t-form-item>
      </t-form>
    </t-card>

    <div class="form-actions">
      <t-space>
        <t-button variant="outline" @click="handleSaveDraft">保存草稿</t-button>
        <t-button theme="primary" @click="handleSavePublish">保存并上线</t-button>
        <t-button variant="outline" @click="openPreview">预览</t-button>
        <t-button variant="text" @click="handleCancel">取消</t-button>
      </t-space>
    </div>

    <t-dialog v-model:visible="previewVisible" header="预览" :footer="false">
      <div class="preview-card">
        <div class="preview-title">{{ form.title || '未命名任务' }}</div>
        <div class="preview-desc">{{ form.description || '暂无描述。' }}</div>
        <div v-if="form.type === 'steps'" class="preview-steps">
          <div v-for="(step, index) in form.steps" :key="`step-${index}`" class="preview-step">
            {{ index + 1 }}. {{ step || '未填写步骤' }}
          </div>
        </div>
        <div v-if="form.type === 'timer'" class="preview-timer">
          <t-button theme="primary" size="small">开始 {{ form.defaultDuration }} 秒</t-button>
        </div>
        <div v-if="form.type === 'free'" class="preview-free">
          <t-button variant="outline" size="small">立即书写</t-button>
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
    MessagePlugin.error('请填写标题。');
    return false;
  }
  if (form.title.length > 20) {
    MessagePlugin.error('标题不超过 20 字。');
    return false;
  }
  if (!form.description.trim()) {
    MessagePlugin.error('请填写描述。');
    return false;
  }
  if (form.description.length > 200) {
    MessagePlugin.error('描述不超过 200 字。');
    return false;
  }
  return true;
};

const validatePublish = () => {
  if (!validateBase()) return false;
  if (form.type === 'timer' && (form.defaultDuration < 30 || form.defaultDuration > 600)) {
    MessagePlugin.error('计时时长需在 30-600 秒之间。');
    return false;
  }
  if (form.type === 'steps') {
    const validSteps = form.steps.filter((step) => step.trim());
    if (!validSteps.length) {
      MessagePlugin.error('至少填写 1 条步骤。');
      return false;
    }
    if (validSteps.some((step) => step.length > 30)) {
      MessagePlugin.error('每条步骤不超过 30 字。');
      return false;
    }
  }
  if (!form.directions.length) {
    MessagePlugin.error('至少选择 1 个方向标签。');
    return false;
  }
  if (!form.traces.length) {
    MessagePlugin.error('至少选择 1 个追踪标签。');
    return false;
  }
  if (form.traces.length > 2) {
    MessagePlugin.error('追踪标签最多 2 个。');
    return false;
  }
  return true;
};

const handleSaveDraft = () => {
  if (!validateBase()) return;
  MessagePlugin.success('草稿已保存（模拟）。');
};

const handleSavePublish = () => {
  if (!validatePublish()) return;
  MessagePlugin.success('已保存并上线（模拟）。');
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

