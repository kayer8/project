<template>
  <section class="page-container">
    <header class="page-header">
      <div class="page-title">{{ title }}</div>
      <div class="page-actions">
        <slot name="actions" />
      </div>
    </header>
    <div class="page-body">
      <slot />
    </div>
  </section>
</template>

<script setup lang="ts">
defineProps<{ title: string }>();
</script>

<style scoped>
.page-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
}

.page-body {
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  border: 1px solid #e6e8f0;
}
</style>