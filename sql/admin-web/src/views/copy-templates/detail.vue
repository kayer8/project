<template>
  <PageContainer :title="isCreate ? '新建文案模板' : '编辑文案模板'">
    <t-card>
      <t-form class="form" label-align="top">
        <t-form-item label="类型" required>
          <t-select v-model="form.type" :options="copyTemplateTypeOptions" />
        </t-form-item>
        <t-form-item label="文案内容" required>
          <t-textarea v-model="form.content" :autosize="{ minRows: 3 }" placeholder="最多 80 字" />
        </t-form-item>
        <t-form-item label="追踪条件">
          <t-select v-model="form.trace" clearable :options="traceOptions" />
        </t-form-item>
        <t-form-item label="心情条件">
          <t-select v-model="form.mood" clearable :options="moodOptions" />
        </t-form-item>
        <t-form-item label="方向条件">
          <t-select v-model="form.direction" clearable :options="directionOptions" />
        </t-form-item>
        <t-form-item label="权重">
          <t-input-number v-model="form.weight" :min="0.1" :max="3" :step="0.1" />
        </t-form-item>
        <t-form-item label="启用">
          <t-switch v-model="form.enabled" />
        </t-form-item>
        <div v-if="poolWarning" class="warning">
          同类型启用数量不足 3 条，请补充文案。
        </div>
      </t-form>
    </t-card>

    <div class="form-actions">
      <t-space>
        <t-button variant="outline" @click="handleSave">保存</t-button>
        <t-button theme="primary" @click="handleSaveEnable">保存并启用</t-button>
        <t-button variant="outline" @click="openPreview">预览</t-button>
        <t-button variant="text" @click="handleCancel">取消</t-button>
      </t-space>
    </div>

    <t-dialog v-model:visible="previewVisible" header="预览" :footer="false">
      <div class="preview-card">
        <div class="preview-title">{{ previewTitle }}</div>
        <div class="preview-text">{{ form.content || '暂无内容。' }}</div>
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
  copyTemplateTypeOptions.find((option) => option.value === form.type)?.label || '预览',
);

const poolWarning = computed(() => enabledCount.value < 3);

const openPreview = () => {
  previewVisible.value = true;
};

const validate = () => {
  if (!form.content.trim()) {
    MessagePlugin.error('请填写文案内容。');
    return false;
  }
  if (form.content.length > 80) {
    MessagePlugin.error('文案内容不超过 80 字。');
    return false;
  }
  return true;
};

const handleSave = () => {
  if (!validate()) return;
  MessagePlugin.success('已保存（模拟）。');
};

const handleSaveEnable = () => {
  if (!validate()) return;
  MessagePlugin.success('已保存并启用（模拟）。');
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

