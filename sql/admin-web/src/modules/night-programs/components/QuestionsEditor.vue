<template>
  <div class="questions-editor">
    <div v-for="(question, index) in questions" :key="question.id" class="question-card">
      <div class="question-head">
        <div class="question-id">{{ question.id }}</div>
        <t-button
          variant="text"
          theme="danger"
          :disabled="questions.length <= 1"
          @click="removeQuestion(index)"
        >
          删除
        </t-button>
      </div>
      <t-input
        :model-value="question.text"
        placeholder="问题文案"
        @update:model-value="(value) => updateQuestion(index, { text: value })"
      />
      <t-input
        :model-value="question.options.join(', ')"
        placeholder="选项用逗号分隔"
        @update:model-value="(value) => updateOptions(index, value)"
      />
    </div>
    <t-button variant="dashed" @click="addQuestion">新增问题</t-button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { ProgramQuestion } from '../types';

const props = defineProps<{
  modelValue: ProgramQuestion[];
}>();

const emit = defineEmits<{
  (event: 'update:modelValue', value: ProgramQuestion[]): void;
}>();

const questions = computed(() => props.modelValue);

const updateQuestion = (index: number, patch: Partial<ProgramQuestion>) => {
  const next = questions.value.map((question, questionIndex) =>
    questionIndex === index ? { ...question, ...patch } : question,
  );
  emit('update:modelValue', next);
};

const updateOptions = (index: number, value: string) => {
  const options = value
    .split(',')
    .map((option) => option.trim())
    .filter(Boolean);
  updateQuestion(index, { options });
};

const nextId = () => {
  const existing = new Set(questions.value.map((question) => question.id));
  const numbers = questions.value
    .map((question) => Number(question.id.replace(/\D/g, '')))
    .filter((num) => Number.isFinite(num));
  let base = numbers.length ? Math.max(...numbers) + 1 : 1;
  let candidate = `Q${base}`;
  while (existing.has(candidate)) {
    base += 1;
    candidate = `Q${base}`;
  }
  return candidate;
};

const addQuestion = () => {
  const next = [
    ...questions.value,
    {
      id: nextId(),
      text: '',
      options: ['是', '否', '跳过'],
    },
  ];
  emit('update:modelValue', next);
};

const removeQuestion = (index: number) => {
  if (questions.value.length <= 1) return;
  const next = questions.value.filter((_, questionIndex) => questionIndex !== index);
  emit('update:modelValue', next);
};
</script>

<style scoped>
.questions-editor {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.question-card {
  border: 1px solid #e6e8f0;
  border-radius: 8px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  background: #fafbff;
}

.question-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.question-id {
  font-weight: 600;
  color: #1f1f1f;
}
</style>
