<template>
  <PageContainer :title="isCreate ? '新建夜间引导' : '编辑夜间引导'">
    <t-card>
      <t-form class="form" label-align="top">
        <t-form-item label="标题" required>
          <t-input v-model="form.title" placeholder="引导标题" />
        </t-form-item>
        <t-form-item label="类型" required>
          <t-select v-model="form.type" :options="nightProgramTypeOptions" />
        </t-form-item>

        <t-form-item v-if="form.type === 'timer'" label="时长（秒）" required>
          <t-input-number v-model="form.duration" :min="30" :max="900" />
        </t-form-item>
        <t-form-item v-if="form.type === 'timer'" label="计时文案" required>
          <t-textarea v-model="form.timerText" :autosize="{ minRows: 3 }" />
        </t-form-item>

        <t-form-item v-if="form.type === 'questions'" label="问题列表" required>
          <QuestionsEditor v-model="form.questions" />
        </t-form-item>

        <t-form-item v-if="form.type === 'audio'" label="音频地址" required>
          <t-input v-model="form.audioUrl" placeholder="https://" />
        </t-form-item>
        <t-form-item v-if="form.type === 'audio'" label="音频文案" required>
          <t-textarea v-model="form.text" :autosize="{ minRows: 3 }" />
        </t-form-item>
        <div v-if="form.type === 'audio' && form.audioUrl" class="audio-preview">
          <audio :src="form.audioUrl" controls />
        </div>

        <t-form-item v-if="form.type === 'text'" label="文本内容" required>
          <t-textarea v-model="form.text" :autosize="{ minRows: 4 }" />
        </t-form-item>

        <t-form-item label="心情标签">
          <t-select v-model="form.moods" multiple clearable :options="moodOptions" />
        </t-form-item>
        <t-form-item label="方向标签">
          <t-select v-model="form.directions" multiple clearable :options="directionOptions" />
        </t-form-item>
      </t-form>
    </t-card>

    <div class="form-actions">
      <t-space>
        <t-button variant="outline" @click="handleSaveDraft">保存草稿</t-button>
        <t-button theme="primary" @click="handleSavePublish">保存并上线</t-button>
        <t-button variant="text" @click="handleCancel">取消</t-button>
      </t-space>
    </div>
  </PageContainer>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { MessagePlugin } from 'tdesign-vue-next';
import PageContainer from '@/components/PageContainer/index.vue';
import QuestionsEditor from '@/modules/night-programs/components/QuestionsEditor.vue';
import { nightProgramTypeOptions, moodOptions, directionOptions } from '@/modules/common/options';
import { fetchNightProgramById } from '@/modules/night-programs/api';
import type { NightProgramType } from '@/modules/night-programs/types';

const router = useRouter();
const route = useRoute();

const isCreate = computed(() => route.params.id === undefined);

const form = reactive({
  title: '',
  type: 'timer' as NightProgramType,
  duration: 300,
  timerText: '',
  text: '',
  audioUrl: '',
  questions: [
    {
      id: 'Q1',
      text: '',
      options: ['是', '否', '跳过'],
    },
  ],
  moods: [] as string[],
  directions: [] as string[],
});

const validateBase = () => {
  if (!form.title.trim()) {
    MessagePlugin.error('请填写标题。');
    return false;
  }
  return true;
};

const validatePublish = () => {
  if (!validateBase()) return false;
  if (form.type === 'timer') {
    if (form.duration < 30) {
      MessagePlugin.error('时长不得少于 30 秒。');
      return false;
    }
    if (!form.timerText.trim()) {
      MessagePlugin.error('请填写计时文案。');
      return false;
    }
  }
  if (form.type === 'questions') {
    if (!form.questions.length) {
      MessagePlugin.error('至少需要 1 个问题。');
      return false;
    }
    if (form.questions.some((question) => !question.text.trim())) {
      MessagePlugin.error('每个问题都需要填写文案。');
      return false;
    }
  }
  if (form.type === 'audio') {
    if (!form.audioUrl.trim()) {
      MessagePlugin.error('请填写音频地址。');
      return false;
    }
    if (!form.text.trim()) {
      MessagePlugin.error('请填写音频文案。');
      return false;
    }
  }
  if (form.type === 'text' && !form.text.trim()) {
    MessagePlugin.error('请填写文本内容。');
    return false;
  }
  return true;
};

const handleSaveDraft = () => {
  if (!validateBase()) return;
  MessagePlugin.success('草稿已保存（模拟）。');
};

const handleSavePublish = () => {
  if (!validatePublish()) return;
  MessagePlugin.success('已保存并上线（模拟）。');
};

const handleCancel = () => {
  router.back();
};

onMounted(async () => {
  const id = route.params.id as string | undefined;
  if (!id) return;
  const detail = await fetchNightProgramById(id);
  if (!detail) return;
  form.title = detail.title;
  form.type = detail.type;
  form.duration = detail.duration || 300;
  form.timerText = detail.content.timerText || '';
  form.text = detail.content.text || '';
  form.audioUrl = detail.content.audioUrl || '';
  form.questions = detail.content.questions?.length
    ? detail.content.questions.map((question) => ({ ...question }))
    : form.questions;
  form.moods = [...detail.tags.moods];
  form.directions = [...detail.tags.directions];
});
</script>

<style scoped>
.form {
  max-width: 720px;
}

.form-actions {
  margin-top: 16px;
}

.audio-preview {
  margin-top: 8px;
}
</style>

