<template>
  <t-form>
    <t-form-item v-for="item in schema" :key="item.name" :label="item.label">
      <t-input v-model="model[item.name]" :placeholder="item.placeholder" />
    </t-form-item>
  </t-form>
</template>

<script setup lang="ts">
import { reactive } from 'vue';
import type { FormSchemaItem } from './schema';

const props = defineProps<{ schema: FormSchemaItem[] }>();
const model = reactive<Record<string, string>>({});
props.schema.forEach((item) => {
  model[item.name] = '';
});
</script>