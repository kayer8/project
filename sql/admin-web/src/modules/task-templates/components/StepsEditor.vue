<template>
  <div class="steps-editor">
    <div v-for="(step, index) in steps" :key="`step-${index}`" class="step-row">
      <t-input
        :model-value="step"
        :placeholder="`Step ${index + 1}`"
        @update:model-value="(value) => updateStep(index, value)"
      />
      <t-button
        variant="text"
        theme="danger"
        :disabled="steps.length <= min"
        @click="removeStep(index)"
      >
        Remove
      </t-button>
    </div>
    <t-button variant="dashed" :disabled="steps.length >= max" @click="addStep">
      Add step
    </t-button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(
  defineProps<{
    modelValue: string[];
    max?: number;
    min?: number;
  }>(),
  {
    max: 3,
    min: 1,
  },
);

const emit = defineEmits<{
  (event: 'update:modelValue', value: string[]): void;
}>();

const steps = computed(() => props.modelValue);

const updateStep = (index: number, value: string) => {
  const next = [...steps.value];
  next[index] = value;
  emit('update:modelValue', next);
};

const addStep = () => {
  if (steps.value.length >= props.max) return;
  emit('update:modelValue', [...steps.value, '']);
};

const removeStep = (index: number) => {
  if (steps.value.length <= props.min) return;
  const next = steps.value.filter((_, stepIndex) => stepIndex !== index);
  emit('update:modelValue', next);
};
</script>

<style scoped>
.steps-editor {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.step-row {
  display: flex;
  gap: 8px;
  align-items: center;
}
</style>
