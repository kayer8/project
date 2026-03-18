import { computed, reactive, ref } from 'vue';

import { fetchOrderBooks, fetchSamplingMarkets } from '@/lib/polymarket';
import { simulateBuyFromAsks, simulateSellToBids } from '@/lib/pricing';
import type { MarketLeg, Opportunity, OpportunityLeg, OrderBook, ScanSettings, ScanStats } from '@/lib/types';

function createDefaultSettings(): ScanSettings {
  return {
    bundleSize: Number(import.meta.env.VITE_DEFAULT_BUNDLE_SIZE ?? 10),
    minProfitRatio: 0.01,
    minProfitUsd: 1,
    maxDaysToResolution: 365,
    maxSpread: 0.08,
    pagesToFetch: Number(import.meta.env.VITE_DEFAULT_SCAN_PAGES ?? 3),
    topN: 12,
    includeAugmented: false,
    includeFeeMarkets: false,
    minMarketsPerBundle: 2,
    requireCompleteGroups: true,
    requireExitLiquidity: true,
  };
}

function roundTo(value: number, digits = 6): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function normalizeTags(tags: string[]): string[] {
  const nextTags = Array.from(new Set(tags.map((tag) => tag.trim()).filter(Boolean)));
  return nextTags.length ? nextTags : ['未分类'];
}

function groupLabel(markets: MarketLeg[]): string {
  const tags = normalizeTags(markets.flatMap((market) => market.tags));
  const firstTag = tags[0];
  if (firstTag !== '未分类') {
    return `${firstTag} · ${markets.length} 条腿`;
  }
  return `${markets.length} 条互斥结果腿`;
}

function groupTitle(markets: MarketLeg[]): string {
  if (markets.length === 1) {
    return markets[0].question;
  }
  return `${markets[0].question}（另含 ${markets.length - 1} 个结果）`;
}

function resolveDate(markets: MarketLeg[]): string | null {
  const dates = markets
    .map((market) => market.endDate)
    .filter((date): date is string => Boolean(date))
    .map((date) => new Date(date))
    .filter((date) => !Number.isNaN(date.getTime()))
    .sort((left, right) => right.getTime() - left.getTime());

  return dates[0]?.toISOString() ?? null;
}

function computeHoldDays(resolutionDate: string | null): number {
  if (!resolutionDate) {
    return 0;
  }
  const now = Date.now();
  const end = new Date(resolutionDate).getTime();
  return Math.max(0, Math.ceil((end - now) / 86400000));
}

function buildOpportunities(
  settings: ScanSettings,
  markets: MarketLeg[],
  books: Map<string, OrderBook>,
  completenessGuaranteed: boolean,
): Opportunity[] {
  if (settings.requireCompleteGroups && !completenessGuaranteed) {
    return [];
  }

  const grouped = new Map<string, MarketLeg[]>();
  const opportunities: Opportunity[] = [];

  for (const market of markets) {
    const bucket = grouped.get(market.groupId) ?? [];
    bucket.push(market);
    grouped.set(market.groupId, bucket);
  }

  for (const [groupId, groupMarkets] of grouped.entries()) {
    if (groupMarkets.length < settings.minMarketsPerBundle) {
      continue;
    }

    const resolutionDate = resolveDate(groupMarkets);
    const holdDays = computeHoldDays(resolutionDate);
    if (holdDays > settings.maxDaysToResolution) {
      continue;
    }

    let totalCost = 0;
    let totalExitValue = 0;
    let worstSpread = 0;
    let feeMode: 'free' | 'paid' = 'free';
    let marketExitReady = true;
    const legs: OpportunityLeg[] = [];
    const tags = normalizeTags(groupMarkets.flatMap((market) => market.tags));
    let valid = true;

    for (const market of groupMarkets) {
      if (!market.acceptingOrders) {
        valid = false;
        break;
      }

      if (!settings.includeFeeMarkets && (market.makerFee > 0 || market.takerFee > 0)) {
        valid = false;
        break;
      }

      if (market.makerFee > 0 || market.takerFee > 0) {
        feeMode = 'paid';
      }

      if (settings.bundleSize < market.minOrderSize) {
        valid = false;
        break;
      }

      const book = books.get(market.yesTokenId);
      if (!book) {
        valid = false;
        break;
      }

      if (book.spread !== null && book.spread > settings.maxSpread) {
        valid = false;
        break;
      }

      const entryQuote = simulateBuyFromAsks(book, settings.bundleSize);
      if (!entryQuote) {
        valid = false;
        break;
      }

      const exitQuote = simulateSellToBids(book, settings.bundleSize);
      if (settings.requireExitLiquidity && !exitQuote) {
        valid = false;
        break;
      }

      totalCost += entryQuote.totalCost;
      worstSpread = Math.max(worstSpread, book.spread ?? 0);

      if (exitQuote) {
        totalExitValue += exitQuote.totalCost;
      } else {
        marketExitReady = false;
      }

      legs.push({
        marketId: market.marketId,
        question: market.question,
        slug: market.slug,
        yesTokenId: market.yesTokenId,
        spread: book.spread,
        quote: entryQuote,
        exitQuote,
        book,
      });
    }

    if (!valid || legs.length !== groupMarkets.length) {
      continue;
    }

    const payout = settings.bundleSize;
    const grossProfit = payout - totalCost;
    if (grossProfit <= 0 || grossProfit < settings.minProfitUsd) {
      continue;
    }

    const profitRatio = grossProfit / payout;
    if (profitRatio < settings.minProfitRatio) {
      continue;
    }

    const roiOnCost = grossProfit / totalCost;
    const annualizedSimple = holdDays > 0 ? (roiOnCost * 365) / holdDays : null;
    const marketExitProfit = marketExitReady ? totalExitValue - totalCost : null;
    const marketExitProfitRatio = marketExitProfit === null ? null : marketExitProfit / payout;
    const marketExitRoiOnCost = marketExitProfit === null ? null : marketExitProfit / totalCost;

    opportunities.push({
      id: `${groupId}:${settings.bundleSize}`,
      groupId,
      title: groupTitle(groupMarkets),
      label: groupLabel(groupMarkets),
      tags,
      groupComplete: completenessGuaranteed,
      marketCount: legs.length,
      bundleSize: settings.bundleSize,
      totalCost: roundTo(totalCost),
      payout: roundTo(payout),
      grossProfit: roundTo(grossProfit),
      profitRatio: roundTo(profitRatio),
      roiOnCost: roundTo(roiOnCost),
      annualizedSimple: annualizedSimple === null ? null : roundTo(annualizedSimple),
      marketExitReady,
      marketExitValue: marketExitReady ? roundTo(totalExitValue) : null,
      marketExitProfit: marketExitProfit === null ? null : roundTo(marketExitProfit),
      marketExitProfitRatio: marketExitProfitRatio === null ? null : roundTo(marketExitProfitRatio),
      marketExitRoiOnCost: marketExitRoiOnCost === null ? null : roundTo(marketExitRoiOnCost),
      holdDays,
      resolutionDate,
      worstSpread: roundTo(worstSpread),
      feeMode,
      legs,
    });
  }

  return opportunities
    .sort((left, right) => {
      if (right.profitRatio !== left.profitRatio) {
        return right.profitRatio - left.profitRatio;
      }
      if ((right.marketExitRoiOnCost ?? -Infinity) !== (left.marketExitRoiOnCost ?? -Infinity)) {
        return (right.marketExitRoiOnCost ?? -Infinity) - (left.marketExitRoiOnCost ?? -Infinity);
      }
      return (right.annualizedSimple ?? -Infinity) - (left.annualizedSimple ?? -Infinity);
    })
    .slice(0, settings.topN);
}

export function useScanner() {
  const settings = reactive<ScanSettings>(createDefaultSettings());
  const opportunities = ref<Opportunity[]>([]);
  const orderBooks = ref<Map<string, OrderBook>>(new Map());
  const selectedId = ref<string | null>(null);
  const loading = ref(false);
  const error = ref('');
  const progress = ref('空闲');
  const lastUpdated = ref<string | null>(null);
  const stats = ref<ScanStats>({
    pagesLoaded: 0,
    marketsLoaded: 0,
    activeNegRiskMarkets: 0,
    bundlesBuilt: 0,
    opportunityCount: 0,
    allPagesLoaded: false,
  });

  const selectedOpportunity = computed(() =>
    opportunities.value.find((opportunity) => opportunity.id === selectedId.value) ?? opportunities.value[0] ?? null,
  );

  async function scan(): Promise<void> {
    loading.value = true;
    error.value = '';
    progress.value = '正在加载 CLOB 市场';

    try {
      const marketPayload = await fetchSamplingMarkets(settings.pagesToFetch, (pagesLoaded, marketsLoaded) => {
        stats.value.pagesLoaded = pagesLoaded;
        stats.value.marketsLoaded = marketsLoaded;
        progress.value = `已加载 ${pagesLoaded} 页，共 ${marketsLoaded} 个市场`;
      });

      const negRiskMarkets = marketPayload.markets.filter((market) => market.negRisk && !market.slug.includes('/other'));
      stats.value.activeNegRiskMarkets = negRiskMarkets.length;
      stats.value.bundlesBuilt = new Set(negRiskMarkets.map((market) => market.groupId)).size;
      stats.value.allPagesLoaded = marketPayload.exhausted;

      progress.value = `正在加载 ${negRiskMarkets.length} 个 YES 订单簿`;
      const books = await fetchOrderBooks(
        negRiskMarkets.map((market) => market.yesTokenId),
        (loadedBatches, totalBatches) => {
          progress.value = `盘口加载进度 ${loadedBatches}/${totalBatches}`;
        },
      );

      const nextOpportunities = buildOpportunities(settings, negRiskMarkets, books, marketPayload.exhausted);

      orderBooks.value = books;
      opportunities.value = nextOpportunities;
      selectedId.value = nextOpportunities[0]?.id ?? null;
      lastUpdated.value = new Date().toISOString();
      stats.value.opportunityCount = nextOpportunities.length;

      if (settings.requireCompleteGroups && !marketPayload.exhausted) {
        progress.value = '扫描完成，但尚未拉完全部市场分页；完整组校验已阻止候选生成';
      } else {
        progress.value = nextOpportunities.length
          ? `扫描完成，得到 ${nextOpportunities.length} 个可模拟执行组合`
          : '扫描完成，但当前筛选条件下没有可用组合';
      }
    } catch (scanError) {
      error.value = scanError instanceof Error ? scanError.message : '未知扫描错误';
      progress.value = '扫描失败';
    } finally {
      loading.value = false;
    }
  }

  return {
    settings,
    opportunities,
    orderBooks,
    selectedId,
    selectedOpportunity,
    loading,
    error,
    progress,
    lastUpdated,
    stats,
    scan,
  };
}
