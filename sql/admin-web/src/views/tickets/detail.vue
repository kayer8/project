<template>
  <PageContainer :title="detail ? `Ticket ${detail.id}` : 'Ticket Detail'">
    <template #actions>
      <t-space>
        <t-button variant="outline" @click="handleAssign" :disabled="!detail">Assign</t-button>
        <t-button theme="primary" @click="handleAdvanceStatus" :disabled="!detail">
          Advance Status
        </t-button>
      </t-space>
    </template>

    <div v-if="detail" class="detail-layout">
      <t-card title="Feedback">
        <div class="info-grid">
          <div class="info-item">
            <div class="info-label">Type</div>
            <div class="info-value">{{ detail.type }}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Status</div>
            <div class="info-value">
              <t-tag :theme="statusTheme(detail.status)" variant="light">{{ formatStatus(detail.status) }}</t-tag>
            </div>
          </div>
          <div class="info-item">
            <div class="info-label">Assignee</div>
            <div class="info-value">{{ detail.assignee || '-' }}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Created</div>
            <div class="info-value">{{ detail.createdAt }}</div>
          </div>
        </div>
        <div class="content-block">
          <div class="info-label">Summary</div>
          <div class="info-value">{{ detail.summary }}</div>
        </div>
        <div class="content-block">
          <div class="info-label">Full content</div>
          <div class="info-value">{{ detail.content }}</div>
        </div>
      </t-card>

      <t-card title="User Snapshot">
        <div class="info-grid">
          <div class="info-item">
            <div class="info-label">User</div>
            <div class="info-value">{{ detail.user.id }}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Version</div>
            <div class="info-value">{{ detail.user.version }}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Device</div>
            <div class="info-value">{{ detail.user.device }}</div>
          </div>
          <div class="info-item">
            <div class="info-label">OS</div>
            <div class="info-value">{{ detail.user.os }}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Active days</div>
            <div class="info-value">{{ detail.user.activeDays }}</div>
          </div>
          <div class="info-item">
            <div class="info-label">New user</div>
            <div class="info-value">{{ detail.user.isNew ? 'Yes' : 'No' }}</div>
          </div>
        </div>
      </t-card>

      <t-card title="Related">
        <div class="info-grid">
          <div class="info-item">
            <div class="info-label">Task template</div>
            <div class="info-value">{{ detail.related?.taskTemplateId || '-' }}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Night program</div>
            <div class="info-value">{{ detail.related?.nightProgramId || '-' }}</div>
          </div>
        </div>
      </t-card>

      <t-card title="Timeline">
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

      <t-card title="Actions">
        <t-form label-align="top" class="form">
          <t-form-item label="Assign to">
            <t-input v-model="assignee" placeholder="Assignee name" />
          </t-form-item>
          <t-form-item label="Change status">
            <t-select v-model="nextStatus" :options="statusOptions" />
          </t-form-item>
          <t-form-item label="Tags">
            <t-select v-model="selectedTags" multiple :options="availableTags" />
          </t-form-item>
          <t-form-item label="Internal note">
            <t-textarea v-model="internalNote" :autosize="{ minRows: 3 }" />
          </t-form-item>
          <t-button theme="primary" @click="applyChanges">Apply</t-button>
        </t-form>
      </t-card>
    </div>

    <t-card v-else>
      <p>Loading ticket details...</p>
    </t-card>
  </PageContainer>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { MessagePlugin } from 'tdesign-vue-next';
import PageContainer from '@/components/PageContainer/index.vue';
import { fetchTicketById } from '@/modules/tickets/api';
import { ticketStatusOptions } from '@/modules/common/options';
import type { Ticket, TicketStatus } from '@/modules/tickets/types';

const route = useRoute();

const detail = ref<Ticket | undefined>();
const assignee = ref('');
const nextStatus = ref<TicketStatus>('new');
const internalNote = ref('');
const selectedTags = ref<string[]>([]);

const availableTags = [
  { label: 'UI', value: 'ui' },
  { label: 'Task', value: 'task' },
  { label: 'Night', value: 'night' },
  { label: 'Push', value: 'push' },
  { label: 'Performance', value: 'performance' },
];

const statusOptions = ticketStatusOptions;

const statusFlow: TicketStatus[] = ['new', 'in_progress', 'resolved', 'closed'];

const formatStatus = (status: TicketStatus) => {
  switch (status) {
    case 'new':
      return 'New';
    case 'in_progress':
      return 'In Progress';
    case 'resolved':
      return 'Resolved';
    case 'closed':
      return 'Closed';
    default:
      return status;
  }
};

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
  MessagePlugin.info('Assign flow opened (mock).');
};

const handleAdvanceStatus = () => {
  if (!detail.value) return;
  const currentIndex = statusFlow.indexOf(detail.value.status);
  const next = statusFlow[Math.min(currentIndex + 1, statusFlow.length - 1)];
  if (next === 'closed' && !internalNote.value.trim()) {
    MessagePlugin.error('Add a note before closing.');
    return;
  }
  MessagePlugin.success(`Status advanced to ${next} (mock).`);
};

const applyChanges = () => {
  if (nextStatus.value === 'closed' && !internalNote.value.trim()) {
    MessagePlugin.error('Add a note before closing.');
    return;
  }
  MessagePlugin.success('Changes applied (mock).');
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
