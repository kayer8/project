import type {
  MarketLeg,
  OrderBook,
  OrderBookLevel,
  RawMarket,
  RawMarketsResponse,
  RawOrderBook,
} from '@/lib/types';

const BASE_URL = 'https://clob.polymarket.com';
const MAX_BOOK_BATCH = 50;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

async function requestJson<T>(path: string, init?: RequestInit, attempts = 3): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(`${BASE_URL}${path}`, {
        ...init,
        headers: {
          'content-type': 'application/json',
          ...(init?.headers ?? {}),
        },
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return (await response.json()) as T;
    } catch (error) {
      lastError = error;
      if (attempt === attempts) {
        throw error;
      }
      await sleep(350 * attempt);
    }
  }
  throw lastError instanceof Error ? lastError : new Error('未知请求错误');
}

function normalizeLevel(level: { price: string; size: string }): OrderBookLevel {
  return {
    price: Number(level.price),
    size: Number(level.size),
  };
}

function normalizeBook(rawBook: RawOrderBook): OrderBook {
  const bids = rawBook.bids.map(normalizeLevel).sort((left, right) => right.price - left.price);
  const asks = rawBook.asks.map(normalizeLevel).sort((left, right) => left.price - right.price);
  const bestBid = bids[0]?.price ?? null;
  const bestAsk = asks[0]?.price ?? null;

  return {
    tokenId: rawBook.asset_id,
    marketId: rawBook.market,
    bids,
    asks,
    minOrderSize: Number(rawBook.min_order_size),
    tickSize: Number(rawBook.tick_size),
    negRisk: rawBook.neg_risk,
    lastTradePrice: rawBook.last_trade_price ? Number(rawBook.last_trade_price) : null,
    bestBid,
    bestAsk,
    spread: bestBid !== null && bestAsk !== null ? bestAsk - bestBid : null,
  };
}

function normalizeMarket(rawMarket: RawMarket): MarketLeg | null {
  const yesToken = rawMarket.tokens.find((token) => token.outcome.toLowerCase() === 'yes');
  const noToken = rawMarket.tokens.find((token) => token.outcome.toLowerCase() === 'no');

  if (!yesToken) {
    return null;
  }

  return {
    marketId: rawMarket.question_id,
    groupId: rawMarket.neg_risk_market_id ?? rawMarket.condition_id,
    question: rawMarket.question,
    slug: rawMarket.market_slug,
    conditionId: rawMarket.condition_id,
    minOrderSize: rawMarket.minimum_order_size,
    tickSize: rawMarket.minimum_tick_size,
    makerFee: rawMarket.maker_base_fee,
    takerFee: rawMarket.taker_base_fee,
    acceptingOrders: rawMarket.accepting_orders,
    negRisk: rawMarket.neg_risk,
    endDate: rawMarket.end_date_iso ?? null,
    tags: rawMarket.tags ?? [],
    yesTokenId: yesToken.token_id,
    noTokenId: noToken?.token_id ?? null,
    displayPrice: yesToken.price,
  };
}

export async function fetchSamplingMarkets(
  pagesToFetch: number,
  onProgress?: (loadedPages: number, loadedMarkets: number) => void,
): Promise<{ pagesLoaded: number; markets: MarketLeg[]; exhausted: boolean }> {
  const markets: MarketLeg[] = [];
  let cursor = 'MA==';
  let pagesLoaded = 0;
  let exhausted = false;

  for (let index = 0; index < pagesToFetch; index += 1) {
    const response = await requestJson<RawMarketsResponse>(
      `/sampling-markets?next_cursor=${encodeURIComponent(cursor)}`,
      { method: 'GET' },
    );

    const normalized = response.data
      .map(normalizeMarket)
      .filter((market): market is MarketLeg => market !== null);

    pagesLoaded += 1;
    markets.push(...normalized);
    onProgress?.(pagesLoaded, markets.length);

    if (!response.next_cursor) {
      exhausted = true;
      break;
    }
    cursor = response.next_cursor;
  }

  return { pagesLoaded, markets, exhausted };
}

function chunk<T>(values: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let index = 0; index < values.length; index += size) {
    out.push(values.slice(index, index + size));
  }
  return out;
}

async function mapLimit<T, R>(
  values: T[],
  limit: number,
  iteratee: (value: T, index: number) => Promise<R>,
): Promise<R[]> {
  const result = new Array<R>(values.length);
  let cursor = 0;

  async function worker(): Promise<void> {
    while (cursor < values.length) {
      const currentIndex = cursor;
      cursor += 1;
      result[currentIndex] = await iteratee(values[currentIndex], currentIndex);
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, values.length) }, () => worker()));
  return result;
}

export async function fetchOrderBooks(
  tokenIds: string[],
  onProgress?: (loadedBatches: number, totalBatches: number) => void,
): Promise<Map<string, OrderBook>> {
  const deduped = Array.from(new Set(tokenIds));
  const batches = chunk(deduped, MAX_BOOK_BATCH);
  const books = new Map<string, OrderBook>();

  await mapLimit(batches, 6, async (batch, index) => {
    const rawBooks = await requestJson<RawOrderBook[]>(
      '/books',
      {
        method: 'POST',
        body: JSON.stringify(batch.map((tokenId) => ({ token_id: tokenId }))),
      },
    );
    rawBooks.forEach((rawBook) => {
      books.set(rawBook.asset_id, normalizeBook(rawBook));
    });
    onProgress?.(index + 1, batches.length);
    return true;
  });

  return books;
}
