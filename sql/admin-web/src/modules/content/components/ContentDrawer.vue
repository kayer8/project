<template>
  <t-drawer :visible="visible" header="Content">
    <ContentForm />
  </t-drawer>
</template>

<script setup lang="ts">
import ContentForm from './ContentForm.vue';

defineProps<{ visible: boolean }>();
</script>