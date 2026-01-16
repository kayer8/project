<template>
  <div class="metric-card" :class="{ clickable }" @click="handleClick">
    <div class="metric-label">{{ label }}</div>
    <div class="metric-value">{{ value }}</div>
    <div v-if="subtext" class="metric-subtext">{{ subtext }}</div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  label: string;
  value: string | number;
  subtext?: string;
  clickable?: boolean;
}>();

const emit = defineEmits<{
  (event: 'click'): void;
}>();

const handleClick = () => {
  if (props.clickable) {
    emit('click');
  }
};
</script>

<style scoped>
.metric-card {
  background: #ffffff;
  border-radius: 10px;
  padding: 16px;
  border: 1px solid #e6e8f0;
  display: flex;
  flex-direction: column;
  gap: 6px;
  transition: box-shadow 0.2s ease, transform 0.2s ease;
}

.metric-card.clickable {
  cursor: pointer;
}

.metric-card.clickable:hover {
  box-shadow: 0 10px 22px rgba(27, 33, 46, 0.12);
  transform: translateY(-2px);
}

.metric-label {
  font-size: 13px;
  color: #6b6f7b;
}

.metric-value {
  font-size: 22px;
  font-weight: 600;
  color: #141414;
}

.metric-subtext {
  font-size: 12px;
  color: #9aa0ae;
}
</style>
