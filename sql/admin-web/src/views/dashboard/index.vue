<template>
  <PageContainer title="Dashboard">
    <t-card title="Overview" class="card">
      <p>Welcome to the admin console.</p>
    </t-card>
  </PageContainer>
</template>

<script setup lang="ts">
import PageContainer from '@/components/PageContainer/index.vue';
</script>

<style scoped>
.card {
  max-width: 520px;
}
</style>