<template>
  <section class="page-container">
    <header class="page-header" v-if="title">
      <h1>{{ title }}</h1>
      <p v-if="description">{{ description }}</p>
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

<style scoped>
.page-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.page-header h1 {
  margin: 0;
  font-size: 24px;
}

.page-header p {
  margin: 8px 0 0;
  color: #5f6b7a;
}
</style>
