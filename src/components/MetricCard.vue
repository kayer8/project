<script setup lang="ts">
defineProps<{
  label: string;
  value: string;
  footnote?: string;
  tone?: 'neutral' | 'positive' | 'warning';
}>();
</script>

<template>
  <article class="metric-card" :data-tone="tone ?? 'neutral'">
    <p class="metric-card__label">{{ label }}</p>
    <strong class="metric-card__value">{{ value }}</strong>
    <p v-if="footnote" class="metric-card__footnote">{{ footnote }}</p>
  </article>
</template>

<style scoped>
.metric-card {
  padding: 1rem 1.1rem;
  border-radius: 20px;
  background: rgba(18, 24, 38, 0.78);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05);
}

.metric-card[data-tone='positive'] {
  background: linear-gradient(160deg, rgba(14, 45, 43, 0.92), rgba(10, 24, 27, 0.95));
}

.metric-card[data-tone='warning'] {
  background: linear-gradient(160deg, rgba(61, 35, 10, 0.92), rgba(24, 17, 11, 0.95));
}

.metric-card__label,
.metric-card__footnote {
  margin: 0;
  color: rgba(232, 236, 245, 0.72);
  font-size: 0.82rem;
}

.metric-card__value {
  display: block;
  margin-top: 0.42rem;
  font-size: 1.55rem;
  line-height: 1.1;
  color: #fbfcff;
}

.metric-card__footnote {
  margin-top: 0.65rem;
}
</style>

