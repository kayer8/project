import { computed, ref, watch } from 'vue';

import { simulateSellToBids } from '@/lib/pricing';
import type { Opportunity, OrderBook, PaperLedgerEntry, PaperPortfolioState, PaperPosition } from '@/lib/types';

const STORAGE_KEY = 'polymarket-edge.paper-portfolio.v1';

interface ClosePositionOptions {
  mode?: 'manual' | 'auto';
  reason?: string;
}

function createDefaultState(): PaperPortfolioState {
  return {
    bankroll: Number(import.meta.env.VITE_DEFAULT_BANKROLL ?? 1000),
    cash: Number(import.meta.env.VITE_DEFAULT_BANKROLL ?? 1000),
    realizedPnl: 0,
    positions: [],
    ledger: [],
  };
}

function loadState(): PaperPortfolioState {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return createDefaultState();
  }

  try {
    const parsed = JSON.parse(raw) as Partial<PaperPortfolioState>;
    return {
      ...createDefaultState(),
      ...parsed,
      positions: Array.isArray(parsed.positions) ? (parsed.positions as PaperPosition[]) : [],
      ledger: Array.isArray(parsed.ledger) ? (parsed.ledger as PaperLedgerEntry[]) : [],
    };
  } catch {
    return createDefaultState();
  }
}

function createLedgerEntry(entry: Omit<PaperLedgerEntry, 'id' | 'createdAt'>): PaperLedgerEntry {
  return {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    ...entry,
  };
}

export function usePaperPortfolio() {
  const state = ref<PaperPortfolioState>(loadState());

  watch(
    state,
    (value) => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    },
    { deep: true },
  );

  const openPositions = computed(() => state.value.positions.filter((position) => !position.closedAt));

  function hasOpenPositionForGroup(groupId: string): boolean {
    return openPositions.value.some((position) => position.groupId === groupId);
  }

  function resetPortfolio(bankroll: number): void {
    state.value = {
      bankroll,
      cash: bankroll,
      realizedPnl: 0,
      positions: [],
      ledger: [
        createLedgerEntry({
          kind: 'reset',
          title: '模拟账户已重置',
          amount: bankroll,
          note: `模拟资金已重置为 ${bankroll.toFixed(2)} USDC`,
        }),
      ],
    };
  }

  function openOpportunity(opportunity: Opportunity): { ok: boolean; message: string } {
    if (state.value.cash < opportunity.totalCost) {
      return {
        ok: false,
        message: `可用资金不足，需要 ${opportunity.totalCost.toFixed(2)} USDC。`,
      };
    }

    const position: PaperPosition = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      title: opportunity.title,
      groupId: opportunity.groupId,
      tags: [...opportunity.tags],
      bundleSize: opportunity.bundleSize,
      totalCost: opportunity.totalCost,
      payout: opportunity.payout,
      expectedProfit: opportunity.grossProfit,
      resolutionDate: opportunity.resolutionDate,
      feeMode: opportunity.feeMode,
      closedAt: null,
      closeValue: null,
      realizedPnl: null,
      legs: opportunity.legs.map((leg) => ({
        marketId: leg.marketId,
        question: leg.question,
        tokenId: leg.yesTokenId,
        shares: leg.quote.shares,
        entryPrice: leg.quote.averagePrice,
        entryCost: leg.quote.totalCost,
      })),
    };

    state.value.cash -= opportunity.totalCost;
    state.value.positions.unshift(position);
    state.value.ledger.unshift(
      createLedgerEntry({
        kind: 'open',
        title: opportunity.title,
        amount: -opportunity.totalCost,
        note: `按实时卖盘开出 ${opportunity.marketCount} 条腿完整组合`,
      }),
    );

    return { ok: true, message: '模拟组合已开仓。' };
  }

  function estimateOpenValue(position: PaperPosition, books: Map<string, OrderBook>): number | null {
    if (position.closedAt) {
      return position.closeValue;
    }

    let total = 0;
    for (const leg of position.legs) {
      const book = books.get(leg.tokenId);
      if (!book) {
        return null;
      }
      const quote = simulateSellToBids(book, leg.shares);
      if (!quote) {
        return null;
      }
      total += quote.totalCost;
    }
    return total;
  }

  function closePosition(
    positionId: string,
    books: Map<string, OrderBook>,
    options: ClosePositionOptions = {},
  ): { ok: boolean; message: string } {
    const position = state.value.positions.find((item) => item.id === positionId);
    if (!position || position.closedAt) {
      return { ok: false, message: '该仓位当前不可平仓。' };
    }

    const closeValue = estimateOpenValue(position, books);
    if (closeValue === null) {
      return { ok: false, message: '当前买盘深度不足，无法完成平仓模拟。' };
    }

    const realizedPnl = closeValue - position.totalCost;
    const modeLabel = options.mode === 'auto' ? '自动' : '手动';
    const reasonSuffix = options.reason ? `，原因：${options.reason}` : '';

    position.closedAt = new Date().toISOString();
    position.closeValue = closeValue;
    position.realizedPnl = realizedPnl;

    state.value.cash += closeValue;
    state.value.realizedPnl += realizedPnl;
    state.value.ledger.unshift(
      createLedgerEntry({
        kind: 'close',
        title: position.title,
        amount: closeValue,
        note: `按实时买盘${modeLabel}平掉模拟组合，盈亏 ${realizedPnl.toFixed(2)} USDC${reasonSuffix}`,
      }),
    );

    return {
      ok: true,
      message: options.mode === 'auto' ? `自动平仓已执行：${position.title}` : '模拟组合已按实时买盘平仓。',
    };
  }

  return {
    state,
    openPositions,
    hasOpenPositionForGroup,
    resetPortfolio,
    openOpportunity,
    estimateOpenValue,
    closePosition,
  };
}
