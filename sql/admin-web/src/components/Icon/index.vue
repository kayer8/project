<template>
  <span class="icon" :style="{ fontSize: size }">
    <slot />
  </span>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ size?: string }>(), {
  size: '16px',
});
</script>