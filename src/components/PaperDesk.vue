<script setup lang="ts">
import { computed, ref, watch } from 'vue';

import { formatDate, formatDateTime, formatPercent, formatUsd } from '@/lib/format';
import type { OrderBook, PaperPortfolioState, PaperPosition } from '@/lib/types';

const props = defineProps<{
  state: PaperPortfolioState;
  orderBooks: Map<string, OrderBook>;
  estimateOpenValue: (position: PaperPosition, books: Map<string, OrderBook>) => number | null;
}>();

const emit = defineEmits<{
  close: [positionId: string];
  reset: [bankroll: number];
}>();

const bankrollDraft = ref(String(props.state.bankroll));

watch(
  () => props.state.bankroll,
  (value) => {
    bankrollDraft.value = String(value);
  },
);

const openPositions = computed(() => props.state.positions.filter((position) => !position.closedAt));
const closedPositions = computed(() => props.state.positions.filter((position) => Boolean(position.closedAt)));

function submitReset(): void {
  const nextBankroll = Number(bankrollDraft.value);
  if (!Number.isFinite(nextBankroll) || nextBankroll <= 0) {
    return;
  }
  emit('reset', nextBankroll);
}

function estimateOpenProfit(position: PaperPosition): number | null {
  const exitValue = props.estimateOpenValue(position, props.orderBooks);
  if (exitValue === null) {
    return null;
  }
  return exitValue - position.totalCost;
}

function estimateOpenRoi(position: PaperPosition): number | null {
  const profit = estimateOpenProfit(position);
  if (profit === null) {
    return null;
  }
  return profit / position.totalCost;
}

function renderTags(tags: string[] | undefined): string {
  return tags && tags.length ? tags.join(' / ') : '未分类';
}
</script>

<template>
  <section class="panel panel--surface">
    <header class="panel__header">
      <div>
        <p class="eyebrow">模拟交易台</p>
        <h2>基于真实数据的模拟执行</h2>
      </div>
      <form class="reset-form" @submit.prevent="submitReset">
        <input v-model="bankrollDraft" name="paperBankroll" type="number" min="1" step="1" />
        <button type="submit">重置资金台</button>
      </form>
    </header>

    <div class="desk-grid">
      <article class="desk-card">
        <span>现金</span>
        <strong>{{ formatUsd(state.cash) }}</strong>
      </article>
      <article class="desk-card">
        <span>已实现盈亏</span>
        <strong :class="{ positive: state.realizedPnl >= 0, negative: state.realizedPnl < 0 }">
          {{ formatUsd(state.realizedPnl) }}
        </strong>
      </article>
      <article class="desk-card">
        <span>未平仓组合</span>
        <strong>{{ openPositions.length }}</strong>
      </article>
      <article class="desk-card">
        <span>总资金</span>
        <strong>{{ formatUsd(state.bankroll) }}</strong>
      </article>
    </div>

    <div class="portfolio-section">
      <div class="portfolio-section__header">
        <h3>持仓中</h3>
        <span>同时展示到期兑付口径和即时退出口径；自动平仓也基于即时退出口径。</span>
      </div>

      <div v-if="!openPositions.length" class="empty-state">
        还没有模拟持仓。可以在机会详情里点击“用该组合做模拟下注”。
      </div>

      <article v-for="position in openPositions" :key="position.id" class="position-card">
        <div class="position-card__row">
          <div>
            <h4>{{ position.title }}</h4>
            <p>
              {{ position.legs.length }} 条腿 · 标签 {{ renderTags(position.tags) }} · 开仓于
              {{ formatDateTime(position.createdAt) }}
            </p>
          </div>
          <button class="close-button" type="button" @click="emit('close', position.id)">按实时买盘平仓</button>
        </div>

        <div class="position-card__stats">
          <div>
            <span>入场成本</span>
            <strong>{{ formatUsd(position.totalCost) }}</strong>
          </div>
          <div>
            <span>到期兑付利润</span>
            <strong>{{ formatUsd(position.expectedProfit) }}</strong>
          </div>
          <div>
            <span>到期结算日</span>
            <strong>{{ formatDate(position.resolutionDate) }}</strong>
          </div>
          <div>
            <span>当前可平仓价值</span>
            <strong>{{
              props.estimateOpenValue(position, props.orderBooks) === null
                ? '暂无'
                : formatUsd(props.estimateOpenValue(position, props.orderBooks) ?? 0)
            }}</strong>
          </div>
          <div>
            <span>当前退出盈亏</span>
            <strong>{{
              estimateOpenProfit(position) === null ? '暂无' : formatUsd(estimateOpenProfit(position) ?? 0)
            }}</strong>
          </div>
          <div>
            <span>当前退出收益率</span>
            <strong>{{
              estimateOpenRoi(position) === null ? '暂无' : formatPercent(estimateOpenRoi(position) ?? 0)
            }}</strong>
          </div>
        </div>
      </article>
    </div>

    <div class="portfolio-section">
      <div class="portfolio-section__header">
        <h3>已平仓</h3>
        <span>最近完成的模拟交易。</span>
      </div>

      <div v-if="!closedPositions.length" class="empty-state">还没有已平仓的模拟组合。</div>

      <article v-for="position in closedPositions.slice(0, 6)" :key="position.id" class="position-card position-card--closed">
        <div class="position-card__row">
          <div>
            <h4>{{ position.title }}</h4>
            <p>平仓于 {{ position.closedAt ? formatDateTime(position.closedAt) : '' }}</p>
          </div>
          <strong :class="{ positive: (position.realizedPnl ?? 0) >= 0, negative: (position.realizedPnl ?? 0) < 0 }">
            {{ formatUsd(position.realizedPnl ?? 0) }}
          </strong>
        </div>
        <div class="position-card__stats">
          <div>
            <span>入场成本</span>
            <strong>{{ formatUsd(position.totalCost) }}</strong>
          </div>
          <div>
            <span>平仓价值</span>
            <strong>{{ formatUsd(position.closeValue ?? 0) }}</strong>
          </div>
          <div>
            <span>已实现收益率</span>
            <strong>{{ formatPercent((position.realizedPnl ?? 0) / position.totalCost) }}</strong>
          </div>
          <div>
            <span>到期兑付利润</span>
            <strong>{{ formatUsd(position.expectedProfit) }}</strong>
          </div>
          <div>
            <span>标签</span>
            <strong>{{ renderTags(position.tags) }}</strong>
          </div>
          <div>
            <span>手续费模式</span>
            <strong>{{ position.feeMode === 'free' ? '免手续费' : '含手续费' }}</strong>
          </div>
        </div>
      </article>
    </div>

    <div class="portfolio-section">
      <div class="portfolio-section__header">
        <h3>流水</h3>
        <span>最近的模拟操作记录</span>
      </div>
      <ul class="ledger">
        <li v-for="entry in state.ledger.slice(0, 8)" :key="entry.id">
          <div>
            <strong>{{ entry.title }}</strong>
            <p>{{ entry.note }}</p>
          </div>
          <div class="ledger__meta">
            <span>{{ formatDateTime(entry.createdAt) }}</span>
            <strong :class="{ positive: entry.amount >= 0, negative: entry.amount < 0 }">
              {{ formatUsd(entry.amount) }}
            </strong>
          </div>
        </li>
      </ul>
    </div>
  </section>
</template>

<style scoped>
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
  align-items: start;
}

.eyebrow {
  margin: 0;
  letter-spacing: 0.14em;
  font-size: 0.72rem;
  color: var(--color-muted);
}

.panel__header h2 {
  margin: 0.15rem 0 0;
  font-size: 1.45rem;
  font-family: var(--font-display);
}

.reset-form {
  display: flex;
  gap: 0.6rem;
}

.reset-form input,
.reset-form button {
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 0.72rem 0.95rem;
  background: rgba(255, 255, 255, 0.04);
  color: inherit;
}

.reset-form button,
.close-button {
  cursor: pointer;
}

.desk-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.9rem;
  margin-top: 1rem;
}

.desk-card,
.position-card {
  border-radius: 22px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.03);
}

.desk-card {
  padding: 1rem;
}

.desk-card span {
  display: block;
  color: var(--color-muted);
  font-size: 0.78rem;
}

.desk-card strong {
  display: block;
  margin-top: 0.35rem;
  font-size: 1.35rem;
}

.portfolio-section {
  margin-top: 1.15rem;
}

.portfolio-section__header {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: end;
  margin-bottom: 0.8rem;
}

.portfolio-section__header h3 {
  margin: 0;
}

.portfolio-section__header span {
  color: var(--color-muted);
  font-size: 0.82rem;
}

.position-card {
  padding: 1rem;
  margin-top: 0.75rem;
}

.position-card--closed {
  background: rgba(255, 255, 255, 0.02);
}

.position-card__row {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: start;
}

.position-card h4 {
  margin: 0;
}

.position-card p {
  margin: 0.35rem 0 0;
  color: var(--color-muted);
  font-size: 0.8rem;
}

.close-button {
  border: 1px solid rgba(122, 248, 200, 0.35);
  background: rgba(122, 248, 200, 0.12);
  color: #d8fff3;
  border-radius: 999px;
  padding: 0.7rem 0.95rem;
}

.position-card__stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.75rem;
  margin-top: 0.9rem;
}

.position-card__stats span {
  display: block;
  color: var(--color-muted);
  font-size: 0.72rem;
}

.position-card__stats strong {
  display: block;
  margin-top: 0.2rem;
}

.ledger {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 0.75rem;
}

.ledger li {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.9rem 1rem;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.ledger p,
.ledger strong,
.ledger span {
  margin: 0;
}

.ledger p,
.ledger__meta span {
  color: var(--color-muted);
  font-size: 0.78rem;
}

.ledger__meta {
  text-align: right;
}

.positive {
  color: #7cf4c2;
}

.negative {
  color: #ff8d7d;
}

.empty-state {
  border-radius: 18px;
  border: 1px dashed rgba(255, 255, 255, 0.12);
  padding: 1rem;
  color: var(--color-muted);
}

@media (max-width: 900px) {
  .desk-grid,
  .position-card__stats {
    grid-template-columns: 1fr;
  }

  .panel__header,
  .portfolio-section__header,
  .position-card__row,
  .ledger li {
    flex-direction: column;
  }

  .ledger__meta {
    text-align: left;
  }
}
</style>
