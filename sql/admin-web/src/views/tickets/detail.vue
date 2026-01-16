<template>
  <PageContainer :title="detail ? `工单 ${detail.id}` : '工单详情'">
    <template #actions>
      <t-space>
        <t-button variant="outline" @click="handleAssign" :disabled="!detail">分配</t-button>
        <t-button theme="primary" @click="handleAdvanceStatus" :disabled="!detail">
          推进状态
        </t-button>
      </t-space>
    </template>

    <div v-if="detail" class="detail-layout">
      <t-card title="反馈内容">
        <div class="info-grid">
          <div class="info-item">
            <div class="info-label">类型</div>
            <div class="info-value">{{ formatType(detail.type) }}</div>
          </div>
          <div class="info-item">
            <div class="info-label">状态</div>
            <div class="info-value">
              <t-tag :theme="statusTheme(detail.status)" variant="light">{{ formatStatus(detail.status) }}</t-tag>
            </div>
          </div>
          <div class="info-item">
            <div class="info-label">负责人</div>
            <div class="info-value">{{ detail.assignee || '-' }}</div>
          </div>
          <div class="info-item">
            <div class="info-label">创建时间</div>
            <div class="info-value">{{ detail.createdAt }}</div>
          </div>
        </div>
        <div class="content-block">
          <div class="info-label">内容摘要</div>
          <div class="info-value">{{ detail.summary }}</div>
        </div>
        <div class="content-block">
          <div class="info-label">反馈详情</div>
          <div class="info-value">{{ detail.content }}</div>
        </div>
      </t-card>

      <t-card title="用户信息">
        <div class="info-grid">
          <div class="info-item">
            <div class="info-label">用户</div>
            <div class="info-value">{{ detail.user.id }}</div>
          </div>
          <div class="info-item">
            <div class="info-label">版本号</div>
            <div class="info-value">{{ detail.user.version }}</div>
          </div>
          <div class="info-item">
            <div class="info-label">机型</div>
            <div class="info-value">{{ detail.user.device }}</div>
          </div>
          <div class="info-item">
            <div class="info-label">系统</div>
            <div class="info-value">{{ detail.user.os }}</div>
          </div>
          <div class="info-item">
            <div class="info-label">活跃天数</div>
            <div class="info-value">{{ detail.user.activeDays }}</div>
          </div>
          <div class="info-item">
            <div class="info-label">新用户</div>
            <div class="info-value">{{ detail.user.isNew ? '是' : '否' }}</div>
          </div>
        </div>
      </t-card>

      <t-card title="关联记录">
        <div class="info-grid">
          <div class="info-item">
            <div class="info-label">任务模板</div>
            <div class="info-value">{{ detail.related?.taskTemplateId || '-' }}</div>
          </div>
          <div class="info-item">
            <div class="info-label">夜间引导</div>
            <div class="info-value">{{ detail.related?.nightProgramId || '-' }}</div>
          </div>
        </div>
      </t-card>

      <t-card title="处理记录">
        <div class="timeline">
          <div v-for="entry in detail.timeline" :key="entry.at" class="timeline-item">
            <div class="timeline-time">{{ entry.at }}</div>
            <div class="timeline-body">
              <strong>{{ entry.actor }}</strong> · {{ entry.action }}
              <div v-if="entry.note" class="timeline-note">{{ entry.note }}</div>
            </div>
          </div>
        </div>
      </t-card>

      <t-card title="操作">
        <t-form label-align="top" class="form">
          <t-form-item label="指派给">
            <t-input v-model="assignee" placeholder="负责人姓名" />
          </t-form-item>
          <t-form-item label="变更状态">
            <t-select v-model="nextStatus" :options="statusOptions" />
          </t-form-item>
          <t-form-item label="标签">
            <t-select v-model="selectedTags" multiple :options="availableTags" />
          </t-form-item>
          <t-form-item label="内部备注">
            <t-textarea v-model="internalNote" :autosize="{ minRows: 3 }" />
          </t-form-item>
          <t-button theme="primary" @click="applyChanges">应用</t-button>
        </t-form>
      </t-card>
    </div>

    <t-card v-else>
      <p>加载工单详情中...</p>
    </t-card>
  </PageContainer>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { MessagePlugin } from 'tdesign-vue-next';
import PageContainer from '@/components/PageContainer/index.vue';
import { fetchTicketById } from '@/modules/tickets/api';
import { ticketStatusOptions, ticketTypeOptions, getOptionLabel } from '@/modules/common/options';
import type { Ticket, TicketStatus } from '@/modules/tickets/types';

const route = useRoute();

const detail = ref<Ticket | undefined>();
const assignee = ref('');
const nextStatus = ref<TicketStatus>('new');
const internalNote = ref('');
const selectedTags = ref<string[]>([]);

const availableTags = [
  { label: '界面', value: 'ui' },
  { label: '任务', value: 'task' },
  { label: '夜间', value: 'night' },
  { label: '推送', value: 'push' },
  { label: '性能', value: 'performance' },
];

const statusOptions = ticketStatusOptions;

const statusFlow: TicketStatus[] = ['new', 'in_progress', 'resolved', 'closed'];

const formatStatus = (status: TicketStatus) => getOptionLabel(ticketStatusOptions, status);
const formatType = (type: Ticket['type']) => getOptionLabel(ticketTypeOptions, type);

const statusTheme = (status: TicketStatus) => {
  switch (status) {
    case 'new':
      return 'warning';
    case 'in_progress':
      return 'primary';
    case 'resolved':
      return 'success';
    case 'closed':
      return 'default';
    default:
      return 'default';
  }
};

const handleAssign = () => {
  MessagePlugin.info('已打开分配流程（模拟）。');
};

const handleAdvanceStatus = () => {
  if (!detail.value) return;
  const currentIndex = statusFlow.indexOf(detail.value.status);
  const next = statusFlow[Math.min(currentIndex + 1, statusFlow.length - 1)];
  if (next === 'closed' && !internalNote.value.trim()) {
    MessagePlugin.error('关闭前需填写备注。');
    return;
  }
  MessagePlugin.success(`状态已推进至${formatStatus(next)}（模拟）。`);
};

const applyChanges = () => {
  if (nextStatus.value === 'closed' && !internalNote.value.trim()) {
    MessagePlugin.error('关闭前需填写备注。');
    return;
  }
  MessagePlugin.success('已应用变更（模拟）。');
};

onMounted(async () => {
  const id = route.params.id as string;
  detail.value = await fetchTicketById(id);
  if (detail.value) {
    assignee.value = detail.value.assignee || '';
    nextStatus.value = detail.value.status;
    selectedTags.value = [...detail.value.tags];
  }
});
</script>

<style scoped>
.detail-layout {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-label {
  font-size: 12px;
  color: #6b6f7b;
}

.info-value {
  font-size: 14px;
  color: #1f1f1f;
}

.content-block {
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.timeline {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.timeline-item {
  display: flex;
  gap: 12px;
}

.timeline-time {
  font-size: 12px;
  color: #6b6f7b;
  min-width: 140px;
}

.timeline-body {
  font-size: 13px;
}

.timeline-note {
  margin-top: 4px;
  color: #4f5565;
}

.form {
  max-width: 480px;
}
</style>

