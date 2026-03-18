<script setup lang="ts">
import { computed } from 'vue';

import { formatDate, formatPercent, formatUsd, shortId } from '@/lib/format';
import type { Opportunity } from '@/lib/types';

const props = defineProps<{
  opportunity: Opportunity | null;
}>();

const emit = defineEmits<{
  paper: [];
}>();

const spreadWidth = computed(() =>
  props.opportunity
    ? `${Math.min(100, Math.max(8, props.opportunity.worstSpread * 900))}%`
    : '0%',
);
</script>

<template>
  <section class="panel panel--surface detail">
    <header class="panel__header">
      <div>
        <p class="eyebrow">机会详情</p>
        <h2>{{ opportunity?.title ?? '请选择一个组合' }}</h2>
      </div>
      <button v-if="opportunity" class="primary-button" type="button" @click="emit('paper')">
        用该组合做模拟下注
      </button>
    </header>

    <div v-if="!opportunity" class="detail__empty">
      从左侧选择一个候选机会，查看到期兑付口径与即时退出口径，并按当前规则模拟开仓。
    </div>

    <template v-else>
      <div class="detail__chips">
        <span>{{ opportunity.groupComplete ? '完整组已验证' : '组完整性未验证' }}</span>
        <span>{{ opportunity.marketExitReady ? '退出侧买盘深度已通过' : '退出侧买盘不足' }}</span>
        <span>标签：{{ opportunity.tags.join(' / ') }}</span>
      </div>

      <div class="detail__grid">
        <div class="detail__summary">
          <h3>到期兑付口径</h3>
          <dl>
            <div>
              <dt>组合份额</dt>
              <dd>每条腿 {{ opportunity.bundleSize.toFixed(2) }} 份</dd>
            </div>
            <div>
              <dt>到期兑付额</dt>
              <dd>{{ formatUsd(opportunity.payout) }}</dd>
            </div>
            <div>
              <dt>到期利润</dt>
              <dd>{{ formatUsd(opportunity.grossProfit) }}</dd>
            </div>
            <div>
              <dt>到期收益率</dt>
              <dd>{{ formatPercent(opportunity.profitRatio) }}</dd>
            </div>
            <div>
              <dt>成本回报率</dt>
              <dd>{{ formatPercent(opportunity.roiOnCost) }}</dd>
            </div>
            <div>
              <dt>持有周期</dt>
              <dd>{{ opportunity.holdDays }} 天，预计于 {{ formatDate(opportunity.resolutionDate) }} 结算</dd>
            </div>
          </dl>
        </div>

        <div class="detail__summary">
          <h3>即时退出口径</h3>
          <dl>
            <div>
              <dt>当前可退出价值</dt>
              <dd>{{ opportunity.marketExitValue === null ? '暂无' : formatUsd(opportunity.marketExitValue) }}</dd>
            </div>
            <div>
              <dt>当前退出盈亏</dt>
              <dd>{{ opportunity.marketExitProfit === null ? '暂无' : formatUsd(opportunity.marketExitProfit) }}</dd>
            </div>
            <div>
              <dt>当前退出收益率</dt>
              <dd>{{
                opportunity.marketExitProfitRatio === null ? '暂无' : formatPercent(opportunity.marketExitProfitRatio)
              }}</dd>
            </div>
            <div>
              <dt>当前退出 ROI</dt>
              <dd>{{
                opportunity.marketExitRoiOnCost === null ? '暂无' : formatPercent(opportunity.marketExitRoiOnCost)
              }}</dd>
            </div>
            <div>
              <dt>入场成本</dt>
              <dd>{{ formatUsd(opportunity.totalCost) }}</dd>
            </div>
            <div>
              <dt>退出状态</dt>
              <dd>{{ opportunity.marketExitReady ? '可按当前买盘完整退出' : '暂时无法完整退出' }}</dd>
            </div>
          </dl>
        </div>

        <div class="detail__spread">
          <div class="detail__spread-label">
            <span>最差观测价差</span>
            <strong>{{ formatPercent(opportunity.worstSpread) }}</strong>
          </div>
          <div class="detail__meter">
            <div class="detail__meter-fill" :style="{ width: spreadWidth }"></div>
          </div>
          <p>当前策略在入场时已经检查退出侧买盘深度，但价差仍会影响即时退出口径的实际表现。</p>
        </div>
      </div>

      <div class="legs">
        <div class="legs__header">
          <h3>腿明细</h3>
          <span>每条腿同时展示实时入场成本和退出侧买盘价值</span>
        </div>

        <article v-for="leg in opportunity.legs" :key="leg.marketId" class="leg-card">
          <div class="leg-card__title-row">
            <div>
              <h4>{{ leg.question }}</h4>
              <p>代币 {{ shortId(leg.yesTokenId) }} · {{ leg.slug }}</p>
            </div>
            <span class="leg-card__spread">价差 {{ leg.spread === null ? '暂无' : formatPercent(leg.spread) }}</span>
          </div>

          <div class="leg-card__stats">
            <div>
              <span>入场成本</span>
              <strong>{{ formatUsd(leg.quote.totalCost) }}</strong>
            </div>
            <div>
              <span>入场均价</span>
              <strong>{{ leg.quote.averagePrice.toFixed(4) }}</strong>
            </div>
            <div>
              <span>退出价值</span>
              <strong>{{ leg.exitQuote ? formatUsd(leg.exitQuote.totalCost) : '暂无' }}</strong>
            </div>
            <div>
              <span>退出均价</span>
              <strong>{{ leg.exitQuote ? leg.exitQuote.averagePrice.toFixed(4) : '暂无' }}</strong>
            </div>
            <div>
              <span>最优卖价</span>
              <strong>{{ leg.quote.firstPrice.toFixed(4) }}</strong>
            </div>
            <div>
              <span>最优买价</span>
              <strong>{{ leg.exitQuote ? leg.exitQuote.firstPrice.toFixed(4) : '暂无' }}</strong>
            </div>
          </div>
        </article>
      </div>
    </template>
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
  align-items: start;
  gap: 1rem;
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

.primary-button {
  padding: 0.85rem 1.1rem;
  border: none;
  border-radius: 999px;
  background: linear-gradient(135deg, #7af8c8, #5dc6ff);
  color: #08111f;
  font-weight: 700;
  cursor: pointer;
}

.detail__empty {
  min-height: 14rem;
  display: grid;
  place-items: center;
  color: var(--color-muted);
}

.detail__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.7rem;
  margin-top: 1rem;
}

.detail__chips span {
  padding: 0.55rem 0.78rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: var(--color-muted);
  font-size: 0.78rem;
}

.detail__grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-top: 1rem;
}

.detail__summary,
.detail__spread,
.leg-card {
  border-radius: 22px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.03);
}

.detail__summary,
.detail__spread {
  padding: 1rem;
}

.detail__summary h3 {
  margin: 0 0 0.85rem;
  font-size: 1rem;
}

.detail__summary dl {
  margin: 0;
  display: grid;
  gap: 0.9rem;
}

.detail__summary dt {
  font-size: 0.75rem;
  color: var(--color-muted);
}

.detail__summary dd {
  margin: 0.2rem 0 0;
  font-size: 1.02rem;
}

.detail__spread {
  grid-column: 1 / -1;
}

.detail__spread-label {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
}

.detail__meter {
  margin-top: 1rem;
  height: 16px;
  border-radius: 999px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.06);
}

.detail__meter-fill {
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #78f4c0, #ffbe64, #ff7462);
}

.detail__spread p {
  margin: 0.9rem 0 0;
  color: var(--color-muted);
  font-size: 0.88rem;
  line-height: 1.5;
}

.legs {
  margin-top: 1rem;
}

.legs__header {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: end;
  margin-bottom: 0.9rem;
}

.legs__header h3 {
  margin: 0;
}

.legs__header span {
  color: var(--color-muted);
  font-size: 0.82rem;
}

.leg-card {
  padding: 1rem;
  margin-top: 0.75rem;
}

.leg-card__title-row {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
}

.leg-card h4 {
  margin: 0;
  font-size: 1rem;
}

.leg-card p {
  margin: 0.3rem 0 0;
  color: var(--color-muted);
  font-size: 0.78rem;
}

.leg-card__spread {
  color: var(--color-muted);
  font-size: 0.8rem;
}

.leg-card__stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.7rem;
  margin-top: 1rem;
}

.leg-card__stats span {
  display: block;
  font-size: 0.72rem;
  color: var(--color-muted);
}

.leg-card__stats strong {
  display: block;
  margin-top: 0.18rem;
}

@media (max-width: 900px) {
  .detail__grid,
  .leg-card__stats {
    grid-template-columns: 1fr;
  }

  .panel__header,
  .legs__header,
  .leg-card__title-row {
    flex-direction: column;
  }
}
</style>
