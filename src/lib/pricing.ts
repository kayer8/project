import type { OrderBook, OrderBookLevel, QuoteResult } from '@/lib/types';

function roundTo(value: number, digits = 6): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function simulateFromLevels(levels: OrderBookLevel[], shares: number): QuoteResult | null {
  if (shares <= 0 || levels.length === 0) {
    return null;
  }

  let remaining = shares;
  let totalCost = 0;
  let firstPrice = levels[0].price;
  let lastPrice = firstPrice;

  for (const level of levels) {
    if (remaining <= 0) {
      break;
    }
    const fill = Math.min(remaining, level.size);
    totalCost += fill * level.price;
    remaining -= fill;
    if (fill > 0) {
      lastPrice = level.price;
    }
  }

  if (remaining > 0) {
    return null;
  }

  const averagePrice = totalCost / shares;
  return {
    shares: roundTo(shares),
    totalCost: roundTo(totalCost),
    averagePrice: roundTo(averagePrice),
    firstPrice: roundTo(firstPrice),
    lastPrice: roundTo(lastPrice),
    slippage: roundTo(averagePrice - firstPrice),
  };
}

export function simulateBuyFromAsks(book: OrderBook, shares: number): QuoteResult | null {
  return simulateFromLevels(book.asks, shares);
}

export function simulateSellToBids(book: OrderBook, shares: number): QuoteResult | null {
  return simulateFromLevels(book.bids, shares);
}

