<template>
  <PageContainer :title="isCreate ? 'New Night Program' : 'Edit Night Program'">
    <t-card>
      <t-form class="form" label-align="top">
        <t-form-item label="Title" required>
          <t-input v-model="form.title" placeholder="Program title" />
        </t-form-item>
        <t-form-item label="Type" required>
          <t-select v-model="form.type" :options="nightProgramTypeOptions" />
        </t-form-item>

        <t-form-item v-if="form.type === 'timer'" label="Duration (seconds)" required>
          <t-input-number v-model="form.duration" :min="30" :max="900" />
        </t-form-item>
        <t-form-item v-if="form.type === 'timer'" label="Timer copy" required>
          <t-textarea v-model="form.timerText" :autosize="{ minRows: 3 }" />
        </t-form-item>

        <t-form-item v-if="form.type === 'questions'" label="Questions" required>
          <QuestionsEditor v-model="form.questions" />
        </t-form-item>

        <t-form-item v-if="form.type === 'audio'" label="Audio URL" required>
          <t-input v-model="form.audioUrl" placeholder="https://" />
        </t-form-item>
        <t-form-item v-if="form.type === 'audio'" label="Audio copy" required>
          <t-textarea v-model="form.text" :autosize="{ minRows: 3 }" />
        </t-form-item>
        <div v-if="form.type === 'audio' && form.audioUrl" class="audio-preview">
          <audio :src="form.audioUrl" controls />
        </div>

        <t-form-item v-if="form.type === 'text'" label="Text" required>
          <t-textarea v-model="form.text" :autosize="{ minRows: 4 }" />
        </t-form-item>

        <t-form-item label="Moods">
          <t-select v-model="form.moods" multiple clearable :options="moodOptions" />
        </t-form-item>
        <t-form-item label="Directions">
          <t-select v-model="form.directions" multiple clearable :options="directionOptions" />
        </t-form-item>
      </t-form>
    </t-card>

    <div class="form-actions">
      <t-space>
        <t-button variant="outline" @click="handleSaveDraft">Save Draft</t-button>
        <t-button theme="primary" @click="handleSavePublish">Save & Publish</t-button>
        <t-button variant="text" @click="handleCancel">Cancel</t-button>
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
      options: ['Yes', 'No', 'Skip'],
    },
  ],
  moods: [] as string[],
  directions: [] as string[],
});

const validateBase = () => {
  if (!form.title.trim()) {
    MessagePlugin.error('Title is required.');
    return false;
  }
  return true;
};

const validatePublish = () => {
  if (!validateBase()) return false;
  if (form.type === 'timer') {
    if (form.duration < 30) {
      MessagePlugin.error('Duration must be at least 30 seconds.');
      return false;
    }
    if (!form.timerText.trim()) {
      MessagePlugin.error('Timer copy is required.');
      return false;
    }
  }
  if (form.type === 'questions') {
    if (!form.questions.length) {
      MessagePlugin.error('At least one question is required.');
      return false;
    }
    if (form.questions.some((question) => !question.text.trim())) {
      MessagePlugin.error('Each question needs text.');
      return false;
    }
  }
  if (form.type === 'audio') {
    if (!form.audioUrl.trim()) {
      MessagePlugin.error('Audio URL is required.');
      return false;
    }
    if (!form.text.trim()) {
      MessagePlugin.error('Audio copy is required.');
      return false;
    }
  }
  if (form.type === 'text' && !form.text.trim()) {
    MessagePlugin.error('Text content is required.');
    return false;
  }
  return true;
};

const handleSaveDraft = () => {
  if (!validateBase()) return;
  MessagePlugin.success('Draft saved (mock).');
};

const handleSavePublish = () => {
  if (!validatePublish()) return;
  MessagePlugin.success('Saved and published (mock).');
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
