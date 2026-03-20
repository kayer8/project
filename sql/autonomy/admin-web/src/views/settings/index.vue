<template>
  <PageContainer title="系统设置">
    <template #actions>
      <t-button theme="primary" @click="handleSave">保存设置</t-button>
    </template>

    <section class="table-summary-grid">
      <section class="admin-panel">
        <div class="admin-panel__header">
          <div>
            <div class="admin-panel__title">社区基础信息</div>
          </div>
        </div>
        <div class="admin-panel__body">
          <div class="settings-grid">
            <label class="settings-field">
              <span class="settings-field__label">社区名称</span>
              <t-input v-model="settings.communityName" />
            </label>
            <label class="settings-field">
              <span class="settings-field__label">管理主体</span>
              <t-input v-model="settings.managementOrg" />
            </label>
            <label class="settings-field">
              <span class="settings-field__label">联系电话</span>
              <t-input v-model="settings.contactPhone" />
            </label>
            <label class="settings-field">
              <span class="settings-field__label">默认发布主体</span>
              <t-select v-model="settings.defaultPublisher" :options="publisherOptions" />
            </label>
          </div>
        </div>
      </section>

      <section class="admin-panel">
        <div class="admin-panel__header">
          <div>
            <div class="admin-panel__title">投票规则</div>
          </div>
        </div>
        <div class="admin-panel__body">
          <div class="settings-grid">
            <label class="settings-field settings-field--inline">
              <span class="settings-field__label">正式表决默认一户一票</span>
              <t-switch v-model="settings.oneHouseOneVote" />
            </label>
            <label class="settings-field settings-field--inline">
              <span class="settings-field__label">允许查看实时结果</span>
              <t-switch v-model="settings.allowLiveResult" />
            </label>
            <label class="settings-field">
              <span class="settings-field__label">默认结果公开时间</span>
              <t-select v-model="settings.resultReveal" :options="resultRevealOptions" />
            </label>
            <label class="settings-field">
              <span class="settings-field__label">提醒提前量</span>
              <t-input v-model="settings.remindBefore" suffix="小时" />
            </label>
          </div>
        </div>
      </section>
    </section>

    <section class="table-summary-grid">
      <section class="admin-panel">
        <div class="admin-panel__header">
          <div>
            <div class="admin-panel__title">公告与公开策略</div>
          </div>
        </div>
        <div class="admin-panel__body">
          <div class="settings-grid">
            <label class="settings-field">
              <span class="settings-field__label">公告默认置顶时长</span>
              <t-input v-model="settings.pinDays" suffix="天" />
            </label>
            <label class="settings-field">
              <span class="settings-field__label">附件大小上限</span>
              <t-input v-model="settings.attachmentLimit" suffix="MB" />
            </label>
            <label class="settings-field settings-field--inline">
              <span class="settings-field__label">公开内容需要审核</span>
              <t-switch v-model="settings.requireDisclosureReview" />
            </label>
            <label class="settings-field settings-field--inline">
              <span class="settings-field__label">公告发布同步消息通知</span>
              <t-switch v-model="settings.syncNotify" />
            </label>
          </div>
        </div>
      </section>

      <section class="admin-panel">
        <div class="admin-panel__header">
          <div>
            <div class="admin-panel__title">管理说明</div>
          </div>
        </div>
        <div class="admin-panel__body">
          <label class="settings-field settings-field--full">
            <span class="settings-field__label">系统说明</span>
            <t-textarea
              v-model="settings.description"
              :autosize="{ minRows: 8, maxRows: 10 }"
            />
          </label>
        </div>
      </section>
    </section>
  </PageContainer>
</template>

<script setup lang="ts">
import { reactive } from 'vue';
import { MessagePlugin } from 'tdesign-vue-next';
import PageContainer from '@/components/PageContainer/index.vue';

const publisherOptions = [
  { label: '物业服务中心', value: '物业服务中心' },
  { label: '业委会秘书处', value: '业委会秘书处' },
  { label: '社区办公室', value: '社区办公室' },
];

const resultRevealOptions = [
  { label: '投票结束后公开', value: 'after_end' },
  { label: '允许实时公开', value: 'live' },
  { label: '仅管理员可见', value: 'private' },
];

const settings = reactive({
  communityName: '海棠社区自治项目',
  managementOrg: '海棠社区业委会',
  contactPhone: '0755-82345678',
  defaultPublisher: '物业服务中心',
  oneHouseOneVote: true,
  allowLiveResult: false,
  resultReveal: 'after_end',
  remindBefore: '12',
  pinDays: '7',
  attachmentLimit: '20',
  requireDisclosureReview: true,
  syncNotify: true,
  description:
    '本系统用于支撑社区自治场景下的公告发布、信息公开、投票管理和业主认证审核。关键状态以后台审核结果为准。',
});

function handleSave() {
  MessagePlugin.success('系统设置已保存');
}
</script>
