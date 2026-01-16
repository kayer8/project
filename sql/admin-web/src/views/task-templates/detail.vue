<template>
  <PageContainer :title="detail?.title || 'Task Template'">
    <template #actions>
      <t-space>
        <t-button theme="primary" @click="handleEdit" :disabled="!detail">Edit</t-button>
        <t-button variant="outline" @click="handleToggleStatus" :disabled="!detail">
          {{ detail?.status === 'online' ? 'Offline' : 'Online' }}
        </t-button>
        <t-button variant="outline" @click="handleCopy" :disabled="!detail">Copy</t-button>
        <t-button variant="outline" @click="handleHistory" :disabled="!detail">History</t-button>
        <t-button v-if="isSuperAdmin" theme="danger" @click="handleDelete" :disabled="!detail">
          Delete
        </t-button>
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
            <div class="info-label">Description</div>
            <div class="info-value">{{ detail.description }}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Type</div>
            <div class="info-value">{{ detail.type }}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Difficulty</div>
            <div class="info-value">{{ detail.difficulty }}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Default duration</div>
            <div class="info-value">
              {{ detail.type === 'timer' ? `${detail.defaultDuration}s` : '-' }}
            </div>
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
            <div class="info-label">Created</div>
            <div class="info-value">{{ detail.createdAt }} · {{ detail.createdBy }}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Updated</div>
            <div class="info-value">{{ detail.updatedAt }} · {{ detail.updatedBy }}</div>
          </div>
        </div>
        <div class="tag-section">
          <div class="info-label">Tags</div>
          <t-space size="small" break-line>
            <t-tag
              v-for="tag in detail.tags.moods"
              :key="`mood-${tag}`"
              variant="light"
              class="clickable-tag"
              @click="handleTagClick(tag, 'mood')"
            >
              mood: {{ tag }}
            </t-tag>
            <t-tag
              v-for="tag in detail.tags.directions"
              :key="`direction-${tag}`"
              variant="light"
              class="clickable-tag"
              @click="handleTagClick(tag, 'direction')"
            >
              direction: {{ tag }}
            </t-tag>
            <t-tag
              v-for="tag in detail.tags.traces"
              :key="`trace-${tag}`"
              variant="light"
              class="clickable-tag"
              @click="handleTagClick(tag, 'trace')"
            >
              trace: {{ tag }}
            </t-tag>
          </t-space>
        </div>
      </t-card>

      <t-card title="Mini Program Preview">
        <div class="preview-card">
          <div class="preview-title">{{ detail.title }}</div>
          <div class="preview-desc">{{ detail.description }}</div>
          <div v-if="detail.type === 'steps'" class="preview-steps">
            <div v-for="(step, index) in detail.steps" :key="`preview-${index}`" class="preview-step">
              {{ index + 1 }}. {{ step }}
            </div>
          </div>
          <div v-if="detail.type === 'timer'" class="preview-timer">
            <t-button theme="primary" size="small">Start {{ detail.defaultDuration }}s</t-button>
          </div>
          <div v-if="detail.type === 'free'" class="preview-free">
            <t-button variant="outline" size="small">Write now</t-button>
          </div>
        </div>
      </t-card>

      <t-card title="Performance">
        <div class="performance-grid">
          <div class="performance-block">
            <div class="performance-title">Last 7 days</div>
            <div class="metric-grid">
              <div class="metric-item">
                <span>Exposure</span>
                <strong>{{ detail.performance.range7d.exposure }}</strong>
              </div>
              <div class="metric-item">
                <span>Completed</span>
                <strong>{{ detail.performance.range7d.completed }}</strong>
              </div>
              <div class="metric-item">
                <span>Skipped</span>
                <strong>{{ detail.performance.range7d.skipped }}</strong>
              </div>
              <div class="metric-item">
                <span>Completion rate</span>
                <strong>{{ formatRate(detail.performance.range7d.completionRate) }}</strong>
              </div>
              <div class="metric-item">
                <span>Skip rate</span>
                <strong>{{ formatRate(detail.performance.range7d.skipRate) }}</strong>
              </div>
              <div class="metric-item">
                <span>Replace rate</span>
                <strong>{{ formatRate(detail.performance.range7d.replaceRate) }}</strong>
              </div>
              <div class="metric-item">
                <span>Note conversion</span>
                <strong>{{ formatRate(detail.performance.range7d.noteConversionRate || 0) }}</strong>
              </div>
            </div>
            <div class="reason-grid">
              <div>
                <div class="info-label">Skip reasons</div>
                <ul>
                  <li v-for="reason in detail.performance.range7d.skipReasons" :key="reason">
                    {{ reason }}
                  </li>
                </ul>
              </div>
              <div>
                <div class="info-label">Replace reasons</div>
                <ul>
                  <li v-for="reason in detail.performance.range7d.replaceReasons" :key="reason">
                    {{ reason }}
                  </li>
                </ul>
              </div>
            </div>
          </div>
          <div class="performance-block">
            <div class="performance-title">Last 30 days</div>
            <div class="metric-grid">
              <div class="metric-item">
                <span>Exposure</span>
                <strong>{{ detail.performance.range30d.exposure }}</strong>
              </div>
              <div class="metric-item">
                <span>Completed</span>
                <strong>{{ detail.performance.range30d.completed }}</strong>
              </div>
              <div class="metric-item">
                <span>Skipped</span>
                <strong>{{ detail.performance.range30d.skipped }}</strong>
              </div>
              <div class="metric-item">
                <span>Completion rate</span>
                <strong>{{ formatRate(detail.performance.range30d.completionRate) }}</strong>
              </div>
              <div class="metric-item">
                <span>Skip rate</span>
                <strong>{{ formatRate(detail.performance.range30d.skipRate) }}</strong>
              </div>
              <div class="metric-item">
                <span>Replace rate</span>
                <strong>{{ formatRate(detail.performance.range30d.replaceRate) }}</strong>
              </div>
            </div>
          </div>
        </div>
      </t-card>
    </div>

    <t-card v-else>
      <p>Loading template details...</p>
    </t-card>
  </PageContainer>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { DialogPlugin, MessagePlugin } from 'tdesign-vue-next';
import PageContainer from '@/components/PageContainer/index.vue';
import { usePermissions } from '@/hooks/usePermissions';
import { fetchTaskTemplateById } from '@/modules/task-templates/api';
import type { TaskTemplate } from '@/modules/task-templates/types';

const route = useRoute();
const router = useRouter();
const { isSuperAdmin } = usePermissions();

const detail = ref<TaskTemplate | undefined>();

const formatRate = (value: number) => `${Math.round(value * 100)}%`;

const handleEdit = () => {
  if (!detail.value) return;
  router.push(`/task-templates/${detail.value.id}/edit`);
};

const handleCopy = () => {
  if (!detail.value) return;
  DialogPlugin.confirm({
    header: 'Copy template',
    body: `Create a draft copy of "${detail.value.title}"?`,
    onConfirm: () => MessagePlugin.success('Copied to draft (mock).'),
  });
};

const handleToggleStatus = () => {
  if (!detail.value) return;
  const next = detail.value.status === 'online' ? 'offline' : 'online';
  DialogPlugin.confirm({
    header: `${next === 'online' ? 'Online' : 'Offline'} template`,
    body: `Confirm to set ${detail.value.title} as ${next}?`,
    onConfirm: () => MessagePlugin.success(`Template set to ${next} (mock).`),
  });
};

const handleHistory = () => {
  MessagePlugin.info('Version history is not available in mock.');
};

const handleDelete = () => {
  if (!detail.value) return;
  DialogPlugin.confirm({
    header: 'Delete template',
    body: 'This action requires super admin approval in production.',
    onConfirm: () => MessagePlugin.success('Template deleted (mock).'),
  });
};

const handleTagClick = (tag: string, tagType: 'mood' | 'direction' | 'trace') => {
  router.push({ path: '/task-templates', query: { tag, tagType } });
};

onMounted(async () => {
  const id = route.params.id as string;
  detail.value = await fetchTaskTemplateById(id);
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

.tag-section {
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.clickable-tag {
  cursor: pointer;
}

.preview-card {
  border-radius: 12px;
  padding: 16px;
  background: linear-gradient(135deg, #f5f7ff, #f1f3ff);
  border: 1px solid #dfe3ff;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.preview-title {
  font-size: 16px;
  font-weight: 600;
}

.preview-desc {
  font-size: 13px;
  color: #4f5565;
}

.preview-steps {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.preview-step {
  font-size: 13px;
  color: #2d2f33;
}

.preview-timer,
.preview-free {
  margin-top: 6px;
}

.performance-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
}

.performance-block {
  border: 1px solid #e6e8f0;
  border-radius: 12px;
  padding: 16px;
  background: #fafbff;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.performance-title {
  font-weight: 600;
  color: #1f1f1f;
}

.metric-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
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

.reason-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
}

.reason-grid ul {
  margin: 6px 0 0;
  padding-left: 16px;
  color: #4f5565;
  font-size: 13px;
}
</style>
