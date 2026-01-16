<template>
  <PageContainer :title="detail?.title || 'Night Program'">
    <template #actions>
      <t-space>
        <t-button theme="primary" @click="handleEdit" :disabled="!detail">Edit</t-button>
        <t-button variant="outline" @click="handleToggleStatus" :disabled="!detail">
          {{ detail?.status === 'online' ? 'Offline' : 'Online' }}
        </t-button>
        <t-button variant="outline" @click="handleCopy" :disabled="!detail">Copy</t-button>
      </t-space>
    </template>

    <div v-if="detail" class="detail-layout">
      <t-card title="Basics">
        <div class="info-grid">
          <div class="info-item">
            <div class="info-label">Title</div>
            <div class="info-value">{{ detail.title }}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Type</div>
            <div class="info-value">{{ detail.type }}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Duration</div>
            <div class="info-value">{{ detail.duration ? `${detail.duration}s` : '-' }}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Status</div>
            <div class="info-value">
              <t-tag :theme="detail.status === 'online' ? 'success' : 'default'" variant="light">
                {{ detail.status }}
              </t-tag>
            </div>
          </div>
          <div class="info-item">
            <div class="info-label">Updated</div>
            <div class="info-value">{{ detail.updatedAt }} · {{ detail.updatedBy }}</div>
          </div>
        </div>
      </t-card>

      <t-card title="Content Preview">
        <div class="preview-card">
          <template v-if="detail.type === 'timer'">
            <div class="preview-title">Timer</div>
            <p>{{ detail.content.timerText }}</p>
            <t-button theme="primary" size="small">Start {{ detail.duration }}s</t-button>
          </template>
          <template v-else-if="detail.type === 'questions'">
            <div class="preview-title">Questions</div>
            <div v-for="question in detail.content.questions" :key="question.id" class="question-item">
              <strong>{{ question.id }}.</strong> {{ question.text }}
              <div class="question-options">Options: {{ question.options.join(', ') }}</div>
            </div>
          </template>
          <template v-else-if="detail.type === 'audio'">
            <div class="preview-title">Audio</div>
            <p>{{ detail.content.text }}</p>
            <audio v-if="detail.content.audioUrl" :src="detail.content.audioUrl" controls />
          </template>
          <template v-else>
            <div class="preview-title">Text</div>
            <p>{{ detail.content.text }}</p>
          </template>
        </div>
      </t-card>

      <t-card title="Performance (7d)">
        <div class="metric-grid">
          <div class="metric-item">
            <span>Exposure</span>
            <strong>{{ detail.performance.range7d.exposure }}</strong>
          </div>
          <div class="metric-item">
            <span>Completion rate</span>
            <strong>{{ formatRate(detail.performance.range7d.completionRate) }}</strong>
          </div>
          <div class="metric-item">
            <span>Exit rate</span>
            <strong>{{ formatRate(detail.performance.range7d.exitRate) }}</strong>
          </div>
        </div>
        <div v-if="detail.performance.range7d.questionStats" class="question-stats">
          <div class="info-label">Question distribution</div>
          <div v-for="(stats, qid) in detail.performance.range7d.questionStats" :key="qid">
            <strong>{{ qid }}</strong>
            <div class="stat-row">
              <span v-for="stat in stats" :key="stat.option">
                {{ stat.option }}: {{ formatRate(stat.rate) }}
              </span>
            </div>
          </div>
        </div>
      </t-card>
    </div>

    <t-card v-else>
      <p>Loading program details...</p>
    </t-card>
  </PageContainer>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { DialogPlugin, MessagePlugin } from 'tdesign-vue-next';
import PageContainer from '@/components/PageContainer/index.vue';
import { fetchNightProgramById } from '@/modules/night-programs/api';
import type { NightProgram } from '@/modules/night-programs/types';

const route = useRoute();
const router = useRouter();

const detail = ref<NightProgram | undefined>();

const formatRate = (value: number) => `${Math.round(value * 100)}%`;

const handleEdit = () => {
  if (!detail.value) return;
  router.push(`/night-programs/${detail.value.id}/edit`);
};

const handleCopy = () => {
  if (!detail.value) return;
  DialogPlugin.confirm({
    header: 'Copy program',
    body: `Create a draft copy of "${detail.value.title}"?`,
    onConfirm: () => MessagePlugin.success('Copied to draft (mock).'),
  });
};

const handleToggleStatus = () => {
  if (!detail.value) return;
  const next = detail.value.status === 'online' ? 'offline' : 'online';
  DialogPlugin.confirm({
    header: `${next === 'online' ? 'Online' : 'Offline'} program`,
    body: `Confirm to set ${detail.value.title} as ${next}?`,
    onConfirm: () => MessagePlugin.success(`Program set to ${next} (mock).`),
  });
};

onMounted(async () => {
  const id = route.params.id as string;
  detail.value = await fetchNightProgramById(id);
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
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
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

.preview-card {
  border-radius: 12px;
  padding: 16px;
  background: #f6f7fb;
  border: 1px solid #e6e8f0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.preview-title {
  font-weight: 600;
  color: #1f1f1f;
}

.question-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 13px;
}

.question-options {
  color: #6b6f7b;
}

.metric-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 12px;
}

.metric-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 13px;
  color: #4f5565;
}

.metric-item strong {
  font-size: 15px;
  color: #1f1f1f;
}

.question-stats {
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.stat-row {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  color: #4f5565;
  font-size: 13px;
}
</style>
