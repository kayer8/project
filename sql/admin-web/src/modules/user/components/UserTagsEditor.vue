<template>
  <t-tag-input :value="tags" @change="handleChange" />
</template>

<script setup lang="ts">
defineProps<{ tags: string[] }>();
const emit = defineEmits<{ (e: 'change', value: string[]): void }>();

const handleChange = (value: string[]) => {
  emit('change', value);
};
</script>
