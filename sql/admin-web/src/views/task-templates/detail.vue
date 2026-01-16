<template>
  <PageContainer :title="detail?.title || '任务模板详情'">
    <template #actions>
      <t-space>
        <t-button theme="primary" @click="handleEdit" :disabled="!detail">编辑</t-button>
        <t-button variant="outline" @click="handleToggleStatus" :disabled="!detail">
          {{ detail?.status === 'online' ? '下线' : '上线' }}
        </t-button>
        <t-button variant="outline" @click="handleCopy" :disabled="!detail">复制</t-button>
        <t-button variant="outline" @click="handleHistory" :disabled="!detail">版本历史</t-button>
        <t-button v-if="isSuperAdmin" theme="danger" @click="handleDelete" :disabled="!detail">
          删除
        </t-button>
      </t-space>
    </template>

    <div v-if="detail" class="detail-layout">
      <t-card title="基础信息">
        <div class="info-grid">
          <div class="info-item">
            <div class="info-label">标题</div>
            <div class="info-value">{{ detail.title }}</div>
          </div>
          <div class="info-item">
            <div class="info-label">描述</div>
            <div class="info-value">{{ detail.description }}</div>
          </div>
          <div class="info-item">
            <div class="info-label">类型</div>
            <div class="info-value">{{ formatType(detail.type) }}</div>
          </div>
          <div class="info-item">
            <div class="info-label">难度</div>
            <div class="info-value">{{ detail.difficulty }}</div>
          </div>
          <div class="info-item">
            <div class="info-label">默认时长</div>
            <div class="info-value">
              {{ detail.type === 'timer' ? `${detail.defaultDuration}秒` : '-' }}
            </div>
          </div>
          <div class="info-item">
            <div class="info-label">状态</div>
            <div class="info-value">
              <t-tag :theme="detail.status === 'online' ? 'success' : 'default'" variant="light">
                {{ formatStatus(detail.status) }}
              </t-tag>
            </div>
          </div>
          <div class="info-item">
            <div class="info-label">创建</div>
            <div class="info-value">{{ detail.createdAt }} · {{ detail.createdBy }}</div>
          </div>
          <div class="info-item">
            <div class="info-label">更新</div>
            <div class="info-value">{{ detail.updatedAt }} · {{ detail.updatedBy }}</div>
          </div>
        </div>
        <div class="tag-section">
          <div class="info-label">标签</div>
          <t-space size="small" break-line>
            <t-tag
              v-for="tag in detail.tags.moods"
              :key="`mood-${tag}`"
              variant="light"
              class="clickable-tag"
              @click="handleTagClick(tag, 'mood')"
            >
              心情：{{ formatMood(tag) }}
            </t-tag>
            <t-tag
              v-for="tag in detail.tags.directions"
              :key="`direction-${tag}`"
              variant="light"
              class="clickable-tag"
              @click="handleTagClick(tag, 'direction')"
            >
              方向：{{ formatDirection(tag) }}
            </t-tag>
            <t-tag
              v-for="tag in detail.tags.traces"
              :key="`trace-${tag}`"
              variant="light"
              class="clickable-tag"
              @click="handleTagClick(tag, 'trace')"
            >
              追踪：{{ formatTrace(tag) }}
            </t-tag>
          </t-space>
        </div>
      </t-card>

      <t-card title="小程序预览">
        <div class="preview-card">
          <div class="preview-title">{{ detail.title }}</div>
          <div class="preview-desc">{{ detail.description }}</div>
          <div v-if="detail.type === 'steps'" class="preview-steps">
            <div v-for="(step, index) in detail.steps" :key="`preview-${index}`" class="preview-step">
              {{ index + 1 }}. {{ step }}
            </div>
          </div>
          <div v-if="detail.type === 'timer'" class="preview-timer">
            <t-button theme="primary" size="small">开始 {{ detail.defaultDuration }} 秒</t-button>
          </div>
          <div v-if="detail.type === 'free'" class="preview-free">
            <t-button variant="outline" size="small">立即书写</t-button>
          </div>
        </div>
      </t-card>

      <t-card title="表现数据">
        <div class="performance-grid">
          <div class="performance-block">
            <div class="performance-title">近7天</div>
            <div class="metric-grid">
              <div class="metric-item">
                <span>曝光</span>
                <strong>{{ detail.performance.range7d.exposure }}</strong>
              </div>
              <div class="metric-item">
                <span>完成</span>
                <strong>{{ detail.performance.range7d.completed }}</strong>
              </div>
              <div class="metric-item">
                <span>跳过</span>
                <strong>{{ detail.performance.range7d.skipped }}</strong>
              </div>
              <div class="metric-item">
                <span>完成率</span>
                <strong>{{ formatRate(detail.performance.range7d.completionRate) }}</strong>
              </div>
              <div class="metric-item">
                <span>跳过率</span>
                <strong>{{ formatRate(detail.performance.range7d.skipRate) }}</strong>
              </div>
              <div class="metric-item">
                <span>换出率</span>
                <strong>{{ formatRate(detail.performance.range7d.replaceRate) }}</strong>
              </div>
              <div class="metric-item">
                <span>写一句转化率</span>
                <strong>{{ formatRate(detail.performance.range7d.noteConversionRate || 0) }}</strong>
              </div>
            </div>
            <div class="reason-grid">
              <div>
                <div class="info-label">跳过原因</div>
                <ul>
                  <li v-for="reason in detail.performance.range7d.skipReasons" :key="reason">
                    {{ reason }}
                  </li>
                </ul>
              </div>
              <div>
                <div class="info-label">被替换原因</div>
                <ul>
                  <li v-for="reason in detail.performance.range7d.replaceReasons" :key="reason">
                    {{ reason }}
                  </li>
                </ul>
              </div>
            </div>
          </div>
          <div class="performance-block">
            <div class="performance-title">近30天</div>
            <div class="metric-grid">
              <div class="metric-item">
                <span>曝光</span>
                <strong>{{ detail.performance.range30d.exposure }}</strong>
              </div>
              <div class="metric-item">
                <span>完成</span>
                <strong>{{ detail.performance.range30d.completed }}</strong>
              </div>
              <div class="metric-item">
                <span>跳过</span>
                <strong>{{ detail.performance.range30d.skipped }}</strong>
              </div>
              <div class="metric-item">
                <span>完成率</span>
                <strong>{{ formatRate(detail.performance.range30d.completionRate) }}</strong>
              </div>
              <div class="metric-item">
                <span>跳过率</span>
                <strong>{{ formatRate(detail.performance.range30d.skipRate) }}</strong>
              </div>
              <div class="metric-item">
                <span>换出率</span>
                <strong>{{ formatRate(detail.performance.range30d.replaceRate) }}</strong>
              </div>
            </div>
          </div>
        </div>
      </t-card>
    </div>

    <t-card v-else>
      <p>加载模板详情中...</p>
    </t-card>
  </PageContainer>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { DialogPlugin, MessagePlugin } from 'tdesign-vue-next';
import PageContainer from '@/components/PageContainer/index.vue';
import { usePermissions } from '@/hooks/usePermissions';
import {
  statusOptions,
  taskTypeOptions,
  moodOptions,
  directionOptions,
  traceOptions,
  getOptionLabel,
} from '@/modules/common/options';
import { fetchTaskTemplateById } from '@/modules/task-templates/api';
import type { TaskTemplate } from '@/modules/task-templates/types';

const route = useRoute();
const router = useRouter();
const { isSuperAdmin } = usePermissions();

const detail = ref<TaskTemplate | undefined>();

const formatRate = (value: number) => `${Math.round(value * 100)}%`;
const formatStatus = (status: TaskTemplate['status']) => getOptionLabel(statusOptions, status);
const formatType = (type: TaskTemplate['type']) => getOptionLabel(taskTypeOptions, type);
const formatMood = (tag: string) => getOptionLabel(moodOptions, tag);
const formatDirection = (tag: string) => getOptionLabel(directionOptions, tag);
const formatTrace = (tag: string) => getOptionLabel(traceOptions, tag);

const handleEdit = () => {
  if (!detail.value) return;
  router.push(`/task-templates/${detail.value.id}/edit`);
};

const handleCopy = () => {
  if (!detail.value) return;
  DialogPlugin.confirm({
    header: '复制模板',
    body: `确认复制「${detail.value.title}」为草稿？`,
    onConfirm: () => MessagePlugin.success('已复制为草稿（模拟）。'),
  });
};

const handleToggleStatus = () => {
  if (!detail.value) return;
  const next = detail.value.status === 'online' ? 'offline' : 'online';
  const nextLabel = next === 'online' ? '上线' : '下线';
  DialogPlugin.confirm({
    header: `${nextLabel}模板`,
    body: `确认将「${detail.value.title}」设为${nextLabel}？`,
    onConfirm: () => MessagePlugin.success(`模板已设为${nextLabel}（模拟）。`),
  });
};

const handleHistory = () => {
  MessagePlugin.info('版本历史在模拟环境不可用。');
};

const handleDelete = () => {
  if (!detail.value) return;
  DialogPlugin.confirm({
    header: '删除模板',
    body: '生产环境需超管审批。',
    onConfirm: () => MessagePlugin.success('模板已删除（模拟）。'),
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

