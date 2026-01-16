<template>
  <div class="tag-summary">
    <t-tag v-for="tag in visibleTags" :key="tag" size="small" variant="light">
      {{ tag }}
    </t-tag>
    <span v-if="hiddenCount > 0" class="tag-more">+{{ hiddenCount }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(
  defineProps<{
    tags?: string[];
    max?: number;
  }>(),
  {
    tags: () => [],
    max: 3,
  },
);

const visibleTags = computed(() => props.tags.slice(0, props.max));
const hiddenCount = computed(() => Math.max(0, props.tags.length - props.max));
</script>

<style scoped>
.tag-summary {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
}

.tag-more {
  font-size: 12px;
  color: #6b6f7b;
}
</style>
