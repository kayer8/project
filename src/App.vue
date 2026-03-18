<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';

import MetricCard from '@/components/MetricCard.vue';
import OpportunityBoard from '@/components/OpportunityBoard.vue';
import OpportunityDetail from '@/components/OpportunityDetail.vue';
import PaperDesk from '@/components/PaperDesk.vue';
import { formatDateTime, formatPercent, formatUsd } from '@/lib/format';
import type { Opportunity, PaperPosition } from '@/lib/types';
import { usePaperPortfolio } from '@/composables/usePaperPortfolio';
import { useScanner } from '@/composables/useScanner';

interface RiskControls {
  maxOpenPositions: number;
  maxGroupExposureRatio: number;
  maxTagExposureRatio: number;
  autoCloseEnabled: boolean;
  autoCloseTakeProfitRatio: number;
  autoCloseStopLossRatio: number;
  autoCloseMaxHoldHours: number;
}

const AUTO_PAPER_TRADE_KEY = 'polymarket-edge.auto-paper-trade.v1';
const RISK_CONTROLS_KEY = 'polymarket-edge.risk-controls.v1';

function loadStoredBoolean(key: string, fallback = false): boolean {
  const raw = localStorage.getItem(key);
  if (raw === null) {
    return fallback;
  }
  return raw === '1' || raw === 'true';
}

function loadStoredJson<T>(key: string, fallback: T): T {
  const raw = localStorage.getItem(key);
  if (!raw) {
    return fallback;
  }

  try {
    return { ...fallback, ...(JSON.parse(raw) as Partial<T>) };
  } catch {
    return fallback;
  }
}

function createDefaultRiskControls(): RiskControls {
  return {
    maxOpenPositions: 4,
    maxGroupExposureRatio: 0.25,
    maxTagExposureRatio: 0.4,
    autoCloseEnabled: true,
    autoCloseTakeProfitRatio: 0.03,
    autoCloseStopLossRatio: 0.05,
    autoCloseMaxHoldHours: 72,
  };
}

function normalizeTags(tags: string[] | undefined): string[] {
  const nextTags = Array.from(new Set((tags ?? []).map((tag) => tag.trim()).filter(Boolean)));
  return nextTags.length ? nextTags : ['未分类'];
}

const scanner = useScanner();
const portfolio = usePaperPortfolio();
const notice = ref('');
const autoRefresh = ref(true);
const autoPaperTrade = ref(loadStoredBoolean(AUTO_PAPER_TRADE_KEY, false));
const riskControls = reactive<RiskControls>(loadStoredJson(RISK_CONTROLS_KEY, createDefaultRiskControls()));
const refreshIntervalMs = 45000;
const refreshCountdown = ref(Math.floor(refreshIntervalMs / 1000));
let countdownTimer: number | null = null;
let refreshTimer: number | null = null;

const headline = computed(() => {
  if (scanner.loading.value) {
    return '正在扫描 Polymarket 实时深度盘口';
  }
  if (scanner.opportunities.value.length > 0) {
    return '已发现通过完整组校验的负风险组合';
  }
  return '当前没有组合通过现有筛选规则';
});

const subline = computed(() =>
  scanner.lastUpdated.value
    ? `最近一次实时刷新：${formatDateTime(scanner.lastUpdated.value)}`
    : '先执行一次扫描，建立机会面板。',
);

function setNotice(message: string): void {
  notice.value = message;
  window.setTimeout(() => {
    if (notice.value === message) {
      notice.value = '';
    }
  }, 3500);
}

function getRiskBudget(): number {
  return Math.max(portfolio.state.value.bankroll, 1);
}

function getPositionAgeHours(position: PaperPosition): number {
  const createdAt = new Date(position.createdAt).getTime();
  if (Number.isNaN(createdAt)) {
    return 0;
  }
  return (Date.now() - createdAt) / 3600000;
}

function getTagExposure(tag: string): number {
  return portfolio.openPositions.value.reduce((total, position) => {
    return normalizeTags(position.tags).includes(tag) ? total + position.totalCost : total;
  }, 0);
}

function evaluateOpenBlock(opportunity: Opportunity): string | null {
  if (portfolio.hasOpenPositionForGroup(opportunity.groupId)) {
    return '同一完整组已有未平仓模拟仓位。';
  }

  if (portfolio.openPositions.value.length >= riskControls.maxOpenPositions) {
    return `已达到最大持仓数 ${riskControls.maxOpenPositions}。`;
  }

  const riskBudget = getRiskBudget();
  if (opportunity.totalCost > riskBudget * riskControls.maxGroupExposureRatio) {
    return `该组合成本超过单组风险上限 ${formatPercent(riskControls.maxGroupExposureRatio)}。`;
  }

  for (const tag of normalizeTags(opportunity.tags)) {
    const nextExposure = getTagExposure(tag) + opportunity.totalCost;
    if (nextExposure > riskBudget * riskControls.maxTagExposureRatio) {
      return `标签「${tag}」将超过风险上限 ${formatPercent(riskControls.maxTagExposureRatio)}。`;
    }
  }

  return null;
}

function tryOpenOpportunity(opportunity: Opportunity, source: 'manual' | 'auto'): { ok: boolean; message: string } {
  const blockMessage = evaluateOpenBlock(opportunity);
  if (blockMessage) {
    return {
      ok: false,
      message: source === 'auto' ? `自动模拟下单已跳过：${blockMessage}` : blockMessage,
    };
  }

  return portfolio.openOpportunity(opportunity);
}

function evaluateAutoCloseReason(position: PaperPosition): string | null {
  if (!riskControls.autoCloseEnabled) {
    return null;
  }

  const exitValue = portfolio.estimateOpenValue(position, scanner.orderBooks.value);
  if (exitValue === null) {
    return null;
  }

  const exitRoi = (exitValue - position.totalCost) / position.totalCost;
  if (exitRoi >= riskControls.autoCloseTakeProfitRatio) {
    return `达到止盈线 ${formatPercent(riskControls.autoCloseTakeProfitRatio)}`;
  }
  if (exitRoi <= -riskControls.autoCloseStopLossRatio) {
    return `触发止损线 ${formatPercent(riskControls.autoCloseStopLossRatio)}`;
  }
  if (getPositionAgeHours(position) >= riskControls.autoCloseMaxHoldHours) {
    return `持仓时间超过 ${riskControls.autoCloseMaxHoldHours} 小时`;
  }

  return null;
}

function runAutoClose(): string[] {
  if (!riskControls.autoCloseEnabled) {
    return [];
  }

  const messages: string[] = [];
  for (const position of [...portfolio.openPositions.value]) {
    const reason = evaluateAutoCloseReason(position);
    if (!reason) {
      continue;
    }

    const result = portfolio.closePosition(position.id, scanner.orderBooks.value, {
      mode: 'auto',
      reason,
    });
    if (result.ok) {
      messages.push(`${position.title}：${reason}`);
    }
  }

  return messages;
}

async function runScan(): Promise<void> {
  refreshCountdown.value = Math.floor(refreshIntervalMs / 1000);
  await scanner.scan();

  const noticeParts: string[] = [];
  const autoCloseMessages = runAutoClose();
  if (autoCloseMessages.length) {
    noticeParts.push(`自动平仓 ${autoCloseMessages.length} 笔`);
  }

  if (!autoPaperTrade.value) {
    if (noticeParts.length) {
      setNotice(noticeParts.join('；'));
    }
    return;
  }

  const topOpportunity = scanner.opportunities.value[0];
  if (!topOpportunity) {
    if (noticeParts.length) {
      setNotice(noticeParts.join('；'));
    }
    return;
  }

  const result = tryOpenOpportunity(topOpportunity, 'auto');
  if (result.ok) {
    noticeParts.push(`自动模拟下单：${topOpportunity.title}`);
  }

  if (noticeParts.length) {
    setNotice(noticeParts.join('；'));
  }
}

function openSelectedPaperTrade(): void {
  const opportunity = scanner.selectedOpportunity.value;
  if (!opportunity) {
    return;
  }

  const result = tryOpenOpportunity(opportunity, 'manual');
  setNotice(result.message);
}

function closePaperTrade(positionId: string): void {
  const result = portfolio.closePosition(positionId, scanner.orderBooks.value);
  setNotice(result.message);
}

function resetDesk(bankroll: number): void {
  portfolio.resetPortfolio(bankroll);
  setNotice(`模拟资金台已重置为 ${formatUsd(bankroll)}。`);
}

function startTimers(): void {
  stopTimers();

  countdownTimer = window.setInterval(() => {
    refreshCountdown.value = Math.max(0, refreshCountdown.value - 1);
  }, 1000);

  if (autoRefresh.value) {
    refreshTimer = window.setInterval(() => {
      void runScan();
    }, refreshIntervalMs);
  }
}

function stopTimers(): void {
  if (countdownTimer !== null) {
    window.clearInterval(countdownTimer);
    countdownTimer = null;
  }
  if (refreshTimer !== null) {
    window.clearInterval(refreshTimer);
    refreshTimer = null;
  }
}

watch(autoRefresh, () => {
  startTimers();
});

watch(autoPaperTrade, (value) => {
  localStorage.setItem(AUTO_PAPER_TRADE_KEY, value ? '1' : '0');
});

watch(
  riskControls,
  (value) => {
    localStorage.setItem(RISK_CONTROLS_KEY, JSON.stringify(value));
  },
  { deep: true },
);

onMounted(() => {
  void runScan();
  startTimers();
});

onBeforeUnmount(() => {
  stopTimers();
});
</script>

<template>
  <div class="shell">
    <div class="shell__glow shell__glow--left"></div>
    <div class="shell__glow shell__glow--right"></div>

    <header class="hero">
      <div class="hero__copy">
        <p class="hero__eyebrow">Vue + TypeScript 实时模拟交易台</p>
        <h1>{{ headline }}</h1>
        <p class="hero__lede">
          纯前端运行，直接拉取真实 CLOB 数据。候选只允许完整组进入，入场前同步检查退出侧买盘深度，并把到期兑付收益与即时退出收益分开展示。
        </p>
        <div class="hero__chips">
          <span>{{ subline }}</span>
          <span>{{ scanner.progress.value }}</span>
          <span>比例字段使用小数，例如 0.05 = 5%</span>
          <span v-if="autoRefresh">{{ refreshCountdown }} 秒后自动刷新</span>
        </div>
      </div>

      <aside class="control-panel">
        <div class="control-panel__header">
          <h2>策略与风控</h2>
          <button class="ghost-button" type="button" :disabled="scanner.loading.value" @click="runScan">
            {{ scanner.loading.value ? '扫描中...' : '立即扫描' }}
          </button>
        </div>

        <div class="control-panel__section">
          <p class="control-panel__section-title">扫描规则</p>
          <div class="control-grid">
            <label>
              组合份额
              <input v-model.number="scanner.settings.bundleSize" name="bundleSize" type="number" min="1" step="1" />
            </label>
            <label>
              最低利润率
              <input
                v-model.number="scanner.settings.minProfitRatio"
                name="minProfitRatio"
                type="number"
                min="0"
                step="0.005"
              />
            </label>
            <label>
              最低利润额
              <input v-model.number="scanner.settings.minProfitUsd" name="minProfitUsd" type="number" min="0" step="0.5" />
            </label>
            <label>
              最大价差
              <input v-model.number="scanner.settings.maxSpread" name="maxSpread" type="number" min="0" step="0.01" />
            </label>
            <label>
              最长持有天数
              <input
                v-model.number="scanner.settings.maxDaysToResolution"
                name="maxDaysToResolution"
                type="number"
                min="1"
                step="1"
              />
            </label>
            <label>
              抓取页数
              <input v-model.number="scanner.settings.pagesToFetch" name="pagesToFetch" type="number" min="1" step="1" />
            </label>
            <label>
              展示前 N 条
              <input v-model.number="scanner.settings.topN" name="topN" type="number" min="1" step="1" />
            </label>
            <label>
              最少腿数
              <input
                v-model.number="scanner.settings.minMarketsPerBundle"
                name="minMarketsPerBundle"
                type="number"
                min="2"
                step="1"
              />
            </label>
          </div>
        </div>

        <div class="control-panel__section">
          <p class="control-panel__section-title">约束开关</p>
          <div class="control-panel__toggles">
            <label class="toggle">
              <input v-model="scanner.settings.requireCompleteGroups" name="requireCompleteGroups" type="checkbox" />
              <span>只允许完整组进入候选</span>
            </label>
            <label class="toggle">
              <input v-model="scanner.settings.requireExitLiquidity" name="requireExitLiquidity" type="checkbox" />
              <span>入场前检查退出侧买盘深度</span>
            </label>
            <label class="toggle">
              <input v-model="scanner.settings.includeFeeMarkets" name="includeFeeMarkets" type="checkbox" />
              <span>包含手续费市场</span>
            </label>
            <label class="toggle">
              <input v-model="autoPaperTrade" name="autoPaperTrade" type="checkbox" />
              <span>自动模拟下单</span>
            </label>
            <label class="toggle">
              <input v-model="riskControls.autoCloseEnabled" name="autoCloseEnabled" type="checkbox" />
              <span>自动平仓</span>
            </label>
            <label class="toggle">
              <input v-model="autoRefresh" name="autoRefresh" type="checkbox" />
              <span>每 45 秒自动刷新</span>
            </label>
          </div>
        </div>

        <div class="control-panel__section">
          <p class="control-panel__section-title">仓位与自动平仓</p>
          <div class="control-grid">
            <label>
              最大持仓数
              <input v-model.number="riskControls.maxOpenPositions" name="maxOpenPositions" type="number" min="1" step="1" />
            </label>
            <label>
              单组风险上限
              <input
                v-model.number="riskControls.maxGroupExposureRatio"
                name="maxGroupExposureRatio"
                type="number"
                min="0.01"
                max="1"
                step="0.01"
              />
            </label>
            <label>
              单标签风险上限
              <input
                v-model.number="riskControls.maxTagExposureRatio"
                name="maxTagExposureRatio"
                type="number"
                min="0.01"
                max="1"
                step="0.01"
              />
            </label>
            <label>
              自动止盈比率
              <input
                v-model.number="riskControls.autoCloseTakeProfitRatio"
                name="autoCloseTakeProfitRatio"
                type="number"
                min="0"
                step="0.01"
              />
            </label>
            <label>
              自动止损比率
              <input
                v-model.number="riskControls.autoCloseStopLossRatio"
                name="autoCloseStopLossRatio"
                type="number"
                min="0"
                step="0.01"
              />
            </label>
            <label>
              最长持仓小时
              <input
                v-model.number="riskControls.autoCloseMaxHoldHours"
                name="autoCloseMaxHoldHours"
                type="number"
                min="1"
                step="1"
              />
            </label>
          </div>
        </div>

        <p v-if="scanner.error.value" class="control-panel__error">扫描错误：{{ scanner.error.value }}</p>
        <p v-if="notice" class="control-panel__notice">{{ notice }}</p>
      </aside>
    </header>

    <section class="metric-strip">
      <MetricCard
        label="已加载页数"
        :value="String(scanner.stats.value.pagesLoaded)"
        :footnote="scanner.stats.value.allPagesLoaded ? '已拉完全部分页，可验证完整组' : '分页尚未拉全，完整组校验会拦截候选'"
      />
      <MetricCard
        label="活跃负风险市场"
        :value="String(scanner.stats.value.activeNegRiskMarkets)"
        :footnote="`已聚合 ${scanner.stats.value.bundlesBuilt} 个组合组`"
      />
      <MetricCard
        label="到期兑付口径"
        :value="scanner.opportunities.value[0] ? formatPercent(scanner.opportunities.value[0].profitRatio) : '暂无'"
        :footnote="scanner.opportunities.value[0] ? `最佳到期利润 ${formatUsd(scanner.opportunities.value[0].grossProfit)}` : '暂无通过筛选的组合'"
        tone="positive"
      />
      <MetricCard
        label="即时退出口径"
        :value="
          scanner.opportunities.value[0]?.marketExitProfitRatio === null || scanner.opportunities.value[0]?.marketExitProfitRatio === undefined
            ? '暂无'
            : formatPercent(scanner.opportunities.value[0].marketExitProfitRatio)
        "
        :footnote="
          scanner.opportunities.value[0]?.marketExitProfit === null || scanner.opportunities.value[0]?.marketExitProfit === undefined
            ? '退出侧买盘不足'
            : `最佳即时退出盈亏 ${formatUsd(scanner.opportunities.value[0].marketExitProfit)}`
        "
      />
      <MetricCard
        label="模拟现金"
        :value="formatUsd(portfolio.state.value.cash)"
        :footnote="`已实现盈亏 ${formatUsd(portfolio.state.value.realizedPnl)}`"
        tone="warning"
      />
    </section>

    <main class="workspace">
      <div class="workspace__left">
        <OpportunityBoard
          :opportunities="scanner.opportunities.value"
          :selected-id="scanner.selectedId.value"
          @select="scanner.selectedId.value = $event"
        />
      </div>

      <div class="workspace__right">
        <OpportunityDetail :opportunity="scanner.selectedOpportunity.value" @paper="openSelectedPaperTrade" />
      </div>
    </main>

    <PaperDesk
      :state="portfolio.state.value"
      :order-books="scanner.orderBooks.value"
      :estimate-open-value="portfolio.estimateOpenValue"
      @close="closePaperTrade"
      @reset="resetDesk"
    />
  </div>
</template>
