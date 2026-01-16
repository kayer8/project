<template>
  <PageContainer title="App Config">
    <template #actions>
      <t-space>
        <t-button variant="outline" @click="handleSave">Save Draft</t-button>
        <t-button theme="primary" @click="handlePublish">Publish</t-button>
        <t-button variant="outline" @click="handleRollback">Rollback</t-button>
      </t-space>
    </template>

    <div class="config-layout">
      <t-card title="Today Tasks">
        <t-form label-align="top">
          <t-form-item label="Daily task count">
            <t-input-number v-model="form.dailyTaskCount" :min="1" :max="5" />
          </t-form-item>
          <t-form-item label="Cooldown days">
            <t-input-number v-model="form.cooldownDays" :min="1" :max="30" />
          </t-form-item>
          <t-form-item label="Direction coverage (at least 2)">
            <t-switch v-model="form.directionCoverageRequired" />
          </t-form-item>
          <t-form-item label="Mood weight">
            <t-input-number v-model="form.moodWeight" :min="0" :max="100" />
          </t-form-item>
          <t-form-item label="Template exposure limit per day">
            <t-input-number v-model="form.templateExposureLimit" :min="1" :max="5" />
          </t-form-item>
        </t-form>
      </t-card>

      <t-card title="Refresh">
        <t-form label-align="top">
          <t-form-item label="Refresh limit per day">
            <t-input-number v-model="form.refreshLimitPerDay" :min="0" :max="5" />
          </t-form-item>
          <t-form-item label="Refresh scope">
            <t-select
              v-model="form.refreshScope"
              :options="[
                { label: 'Single slot', value: 'single' },
                { label: 'Any slot', value: 'any' },
              ]"
            />
          </t-form-item>
          <t-form-item label="Skip protection">
            <t-switch v-model="form.skipProtection" />
          </t-form-item>
        </t-form>
      </t-card>

      <t-card title="Night Recommendations">
        <t-form label-align="top">
          <t-form-item label="Sort strategy">
            <t-select
              v-model="form.nightSortStrategy"
              :options="[
                { label: 'Default', value: 'default' },
                { label: 'Completion rate', value: 'completion' },
                { label: 'Audience', value: 'audience' },
              ]"
            />
          </t-form-item>
          <t-form-item label="Trace tags to write">
            <t-select v-model="form.nightTraceTags" multiple :options="traceOptions" />
          </t-form-item>
        </t-form>
      </t-card>

      <t-card title="Change History">
        <t-table :data="configLogs" :columns="logColumns" row-key="version" />
      </t-card>
    </div>
  </PageContainer>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { DialogPlugin, MessagePlugin } from 'tdesign-vue-next';
import PageContainer from '@/components/PageContainer/index.vue';
import { traceOptions } from '@/modules/common/options';
import { fetchAppConfig, fetchConfigLogs } from '@/modules/app-config/api';
import type { AppConfig, ConfigChangeLog } from '@/modules/app-config/types';

const form = reactive<AppConfig>({
  dailyTaskCount: 3,
  cooldownDays: 7,
  directionCoverageRequired: true,
  moodWeight: 60,
  templateExposureLimit: 2,
  refreshLimitPerDay: 2,
  refreshScope: 'any',
  skipProtection: true,
  nightSortStrategy: 'completion',
  nightTraceTags: [],
  version: 0,
  status: 'draft',
  updatedAt: '',
  updatedBy: '',
});

const configLogs = ref<ConfigChangeLog[]>([]);

const logColumns = [
  { colKey: 'version', title: 'Version', width: 80 },
  { colKey: 'updatedAt', title: 'Updated at', width: 160 },
  { colKey: 'updatedBy', title: 'Updated by', width: 120 },
  { colKey: 'diff', title: 'Change summary', minWidth: 220 },
];

const handleSave = () => {
  MessagePlugin.success('Config saved as draft (mock).');
};

const handlePublish = () => {
  DialogPlugin.confirm({
    header: 'Publish config',
    body: 'Publish this configuration to production?',
    onConfirm: () => MessagePlugin.success('Config published (mock).'),
  });
};

const handleRollback = () => {
  DialogPlugin.confirm({
    header: 'Rollback config',
    body: 'Rollback to the previous version?',
    onConfirm: () => MessagePlugin.success('Rollback applied (mock).'),
  });
};

onMounted(async () => {
  const config = await fetchAppConfig();
  Object.assign(form, config);
  configLogs.value = await fetchConfigLogs();
});
</script>

<style scoped>
.config-layout {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
}
</style>
