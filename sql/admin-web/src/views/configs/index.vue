<template>
  <PageContainer title="规则配置">
    <template #actions>
      <t-space>
        <t-button variant="outline" @click="handleSave">保存草稿</t-button>
        <t-button theme="primary" @click="handlePublish">发布生效</t-button>
        <t-button variant="outline" @click="handleRollback">回滚</t-button>
      </t-space>
    </template>

    <div class="config-layout">
      <t-card title="今日任务生成">
        <t-form label-align="top">
          <t-form-item label="每日任务数">
            <t-input-number v-model="form.dailyTaskCount" :min="1" :max="5" />
          </t-form-item>
          <t-form-item label="冷却天数">
            <t-input-number v-model="form.cooldownDays" :min="1" :max="30" />
          </t-form-item>
          <t-form-item label="方向覆盖（至少 2 个）">
            <t-switch v-model="form.directionCoverageRequired" />
          </t-form-item>
          <t-form-item label="心情权重">
            <t-input-number v-model="form.moodWeight" :min="0" :max="100" />
          </t-form-item>
          <t-form-item label="单模板每日最大曝光">
            <t-input-number v-model="form.templateExposureLimit" :min="1" :max="5" />
          </t-form-item>
        </t-form>
      </t-card>

      <t-card title="换一换">
        <t-form label-align="top">
          <t-form-item label="每日换一换上限">
            <t-input-number v-model="form.refreshLimitPerDay" :min="0" :max="5" />
          </t-form-item>
          <t-form-item label="替换范围">
            <t-select
              v-model="form.refreshScope"
              :options="[
                { label: '仅替换 1 个', value: 'single' },
                { label: '可替换任意位置', value: 'any' },
              ]"
            />
          </t-form-item>
          <t-form-item label="跳过保护">
            <t-switch v-model="form.skipProtection" />
          </t-form-item>
        </t-form>
      </t-card>

      <t-card title="夜间推荐">
        <t-form label-align="top">
          <t-form-item label="排序策略">
            <t-select
              v-model="form.nightSortStrategy"
              :options="[
                { label: '默认', value: 'default' },
                { label: '按完成率', value: 'completion' },
                { label: '按人群', value: 'audience' },
              ]"
            />
          </t-form-item>
          <t-form-item label="写入的追踪标签">
            <t-select v-model="form.nightTraceTags" multiple :options="traceOptions" />
          </t-form-item>
        </t-form>
      </t-card>

      <t-card title="变更历史">
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
  { colKey: 'version', title: '版本', width: 80 },
  { colKey: 'updatedAt', title: '更新时间', width: 160 },
  { colKey: 'updatedBy', title: '更新人', width: 120 },
  { colKey: 'diff', title: '变更摘要', minWidth: 220 },
];

const handleSave = () => {
  MessagePlugin.success('配置已保存为草稿（模拟）。');
};

const handlePublish = () => {
  DialogPlugin.confirm({
    header: '发布配置',
    body: '确认发布该配置并立即生效？',
    onConfirm: () => MessagePlugin.success('配置已发布（模拟）。'),
  });
};

const handleRollback = () => {
  DialogPlugin.confirm({
    header: '回滚配置',
    body: '确认回滚到上一个版本？',
    onConfirm: () => MessagePlugin.success('已应用回滚（模拟）。'),
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

