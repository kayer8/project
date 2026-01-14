<template>
  <BaseForm :schema="schema" />
</template>

<script setup lang="ts">
import BaseForm from '@/components/BaseForm/index.vue';
import { contentFormSchema as schema } from '../schema';
</script>