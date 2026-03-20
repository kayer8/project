<template>
  <section class="page-container">
    <header v-if="title || $slots.actions" class="page-header">
      <h1 v-if="title">{{ title }}</h1>
      <p v-if="description">{{ description }}</p>
      <div v-if="$slots.actions" class="page-header__actions">
        <slot name="actions" />
      </div>
    </header>
    <div class="page-body">
      <slot />
    </div>
  </section>
</template>

<script setup lang="ts">
defineProps<{
  title?: string;
  description?: string;
}>();
</script>
