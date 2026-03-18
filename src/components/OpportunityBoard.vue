<script setup lang="ts">
import { formatDate, formatPercent, formatUsd } from '@/lib/format';
import type { Opportunity } from '@/lib/types';

defineProps<{
  opportunities: Opportunity[];
  selectedId: string | null;
}>();

const emit = defineEmits<{
  select: [id: string];
}>();
</script>

<template>
  <section class="panel panel--surface">
    <header class="panel__header">
      <div>
        <p class="eyebrow">扫描结果</p>
        <h2>机会面板</h2>
      </div>
      <p class="panel__hint">这里只显示完整组且通过退出深度检查的候选组合。</p>
    </header>

    <div v-if="!opportunities.length" class="empty-state">
      <p>当前没有组合通过规则筛选。</p>
      <span>你可以放宽利润条件，或提高抓取页数以完成完整组校验。</span>
    </div>

    <div v-else class="opportunity-list">
      <button
        v-for="opportunity in opportunities"
        :key="opportunity.id"
        class="opportunity-card"
        :class="{ 'opportunity-card--active': opportunity.id === selectedId }"
        type="button"
        @click="emit('select', opportunity.id)"
      >
        <div class="opportunity-card__topline">
          <span>{{ opportunity.label }}</span>
          <span>
            {{ opportunity.groupComplete ? '完整组已验证' : '组完整性未验证' }} ·
            {{ opportunity.feeMode === 'free' ? '免手续费' : '含手续费' }}
          </span>
        </div>
        <h3>{{ opportunity.title }}</h3>
        <div class="opportunity-card__stats">
          <div>
            <span>入场成本</span>
            <strong>{{ formatUsd(opportunity.totalCost) }}</strong>
          </div>
          <div>
            <span>到期利润</span>
            <strong>{{ formatUsd(opportunity.grossProfit) }}</strong>
          </div>
          <div>
            <span>即时退出盈亏</span>
            <strong>{{
              opportunity.marketExitProfit === null ? '暂无' : formatUsd(opportunity.marketExitProfit)
            }}</strong>
          </div>
          <div>
            <span>即时退出收益率</span>
            <strong>{{
              opportunity.marketExitProfitRatio === null ? '暂无' : formatPercent(opportunity.marketExitProfitRatio)
            }}</strong>
          </div>
        </div>
        <div class="opportunity-card__footer">
          <span>{{ opportunity.marketCount }} 条腿</span>
          <span>到期收益率 {{ formatPercent(opportunity.profitRatio) }}</span>
          <span>预计结算 {{ formatDate(opportunity.resolutionDate) }}</span>
        </div>
      </button>
    </div>
  </section>
</template>

<style scoped>
.panel {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.panel--surface {
  padding: 1.25rem;
  border-radius: 28px;
  background: rgba(12, 18, 29, 0.82);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 18px 80px rgba(4, 9, 19, 0.34);
}

.panel__header {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: end;
}

.panel__header h2 {
  margin: 0.15rem 0 0;
  font-family: var(--font-display);
  font-size: 1.45rem;
}

.eyebrow {
  margin: 0;
  letter-spacing: 0.14em;
  font-size: 0.72rem;
  color: var(--color-muted);
}

.panel__hint {
  margin: 0;
  max-width: 24rem;
  color: var(--color-muted);
  font-size: 0.88rem;
  text-align: right;
}

.opportunity-list {
  display: grid;
  gap: 0.85rem;
}

.opportunity-card {
  text-align: left;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: linear-gradient(180deg, rgba(21, 29, 44, 0.92), rgba(11, 16, 25, 0.98));
  color: inherit;
  border-radius: 22px;
  padding: 1rem;
  transition: transform 160ms ease, border-color 160ms ease, box-shadow 160ms ease;
}

.opportunity-card:hover,
.opportunity-card--active {
  transform: translateY(-2px);
  border-color: rgba(114, 255, 201, 0.4);
  box-shadow: 0 18px 40px rgba(8, 20, 37, 0.4);
}

.opportunity-card__topline,
.opportunity-card__footer {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  color: var(--color-muted);
  font-size: 0.78rem;
}

.opportunity-card h3 {
  margin: 0.7rem 0 0.95rem;
  font-size: 1.05rem;
  line-height: 1.4;
}

.opportunity-card__stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.7rem;
  margin-bottom: 0.9rem;
}

.opportunity-card__stats span {
  display: block;
  font-size: 0.72rem;
  color: var(--color-muted);
}

.opportunity-card__stats strong {
  display: block;
  margin-top: 0.25rem;
  font-size: 0.95rem;
}

.empty-state {
  display: grid;
  place-items: center;
  min-height: 14rem;
  border-radius: 22px;
  border: 1px dashed rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.02);
  text-align: center;
}

.empty-state p,
.empty-state span {
  margin: 0;
}

.empty-state span {
  margin-top: 0.4rem;
  color: var(--color-muted);
}

@media (max-width: 900px) {
  .opportunity-card__stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .panel__header {
    align-items: start;
    flex-direction: column;
  }

  .panel__hint,
  .opportunity-card__topline,
  .opportunity-card__footer {
    text-align: left;
    flex-direction: column;
  }
}
</style>
