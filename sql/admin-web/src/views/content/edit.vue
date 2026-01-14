<template>
  <PageContainer title="Content Edit">
    <BaseForm :schema="schema" />
  </PageContainer>
</template>

<script setup lang="ts">
import PageContainer from '@/components/PageContainer/index.vue';
import BaseForm from '@/components/BaseForm/index.vue';
import { contentFormSchema as schema } from '@/modules/content/schema';
</script>