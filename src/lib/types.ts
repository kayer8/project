export interface RawRewardRate {
  asset_address: string;
  rewards_daily_rate: number;
}

export interface RawRewards {
  rates: RawRewardRate[] | null;
  min_size: number;
  max_spread: number;
}

export interface RawToken {
  token_id: string;
  outcome: string;
  price: number;
  winner: boolean;
}

export interface RawMarket {
  enable_order_book: boolean;
  active: boolean;
  closed: boolean;
  archived: boolean;
  accepting_orders: boolean;
  accepting_order_timestamp?: string;
  minimum_order_size: number;
  minimum_tick_size: number;
  condition_id: string;
  question_id: string;
  question: string;
  description?: string;
  market_slug: string;
  end_date_iso?: string;
  game_start_time?: string | null;
  seconds_delay: number;
  fpmm?: string;
  maker_base_fee: number;
  taker_base_fee: number;
  notifications_enabled?: boolean;
  neg_risk: boolean;
  neg_risk_market_id?: string;
  neg_risk_request_id?: string;
  icon?: string;
  image?: string;
  rewards: RawRewards;
  is_50_50_outcome?: boolean;
  tokens: RawToken[];
  tags?: string[];
}

export interface RawMarketsResponse {
  data: RawMarket[];
  next_cursor?: string;
  limit?: number;
  count?: number;
}

export interface RawBookLevel {
  price: string;
  size: string;
}

export interface RawOrderBook {
  market: string;
  asset_id: string;
  timestamp: string;
  bids: RawBookLevel[];
  asks: RawBookLevel[];
  min_order_size: string;
  tick_size: string;
  neg_risk: boolean;
  last_trade_price?: string;
}

export interface OrderBookLevel {
  price: number;
  size: number;
}

export interface OrderBook {
  tokenId: string;
  marketId: string;
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
  minOrderSize: number;
  tickSize: number;
  negRisk: boolean;
  lastTradePrice: number | null;
  bestBid: number | null;
  bestAsk: number | null;
  spread: number | null;
}

export interface MarketLeg {
  marketId: string;
  groupId: string;
  question: string;
  slug: string;
  conditionId: string;
  minOrderSize: number;
  tickSize: number;
  makerFee: number;
  takerFee: number;
  acceptingOrders: boolean;
  negRisk: boolean;
  endDate: string | null;
  tags: string[];
  yesTokenId: string;
  noTokenId: string | null;
  displayPrice: number;
}

export interface QuoteResult {
  shares: number;
  totalCost: number;
  averagePrice: number;
  firstPrice: number;
  lastPrice: number;
  slippage: number;
}

export interface OpportunityLeg {
  marketId: string;
  question: string;
  slug: string;
  yesTokenId: string;
  spread: number | null;
  quote: QuoteResult;
  exitQuote: QuoteResult | null;
  book: OrderBook;
}

export interface Opportunity {
  id: string;
  groupId: string;
  title: string;
  label: string;
  tags: string[];
  groupComplete: boolean;
  marketCount: number;
  bundleSize: number;
  totalCost: number;
  payout: number;
  grossProfit: number;
  profitRatio: number;
  roiOnCost: number;
  annualizedSimple: number | null;
  marketExitReady: boolean;
  marketExitValue: number | null;
  marketExitProfit: number | null;
  marketExitProfitRatio: number | null;
  marketExitRoiOnCost: number | null;
  holdDays: number;
  resolutionDate: string | null;
  worstSpread: number;
  feeMode: 'free' | 'paid';
  legs: OpportunityLeg[];
}

export interface ScanSettings {
  bundleSize: number;
  minProfitRatio: number;
  minProfitUsd: number;
  maxDaysToResolution: number;
  maxSpread: number;
  pagesToFetch: number;
  topN: number;
  includeAugmented: boolean;
  includeFeeMarkets: boolean;
  minMarketsPerBundle: number;
  requireCompleteGroups: boolean;
  requireExitLiquidity: boolean;
}

export interface ScanStats {
  pagesLoaded: number;
  marketsLoaded: number;
  activeNegRiskMarkets: number;
  bundlesBuilt: number;
  opportunityCount: number;
  allPagesLoaded: boolean;
}

export interface PaperPositionLeg {
  marketId: string;
  question: string;
  tokenId: string;
  shares: number;
  entryPrice: number;
  entryCost: number;
}

export interface PaperPosition {
  id: string;
  createdAt: string;
  title: string;
  groupId: string;
  tags: string[];
  bundleSize: number;
  totalCost: number;
  payout: number;
  expectedProfit: number;
  resolutionDate: string | null;
  feeMode: 'free' | 'paid';
  legs: PaperPositionLeg[];
  closedAt: string | null;
  closeValue: number | null;
  realizedPnl: number | null;
}

export interface PaperLedgerEntry {
  id: string;
  kind: 'open' | 'close' | 'reset';
  createdAt: string;
  title: string;
  amount: number;
  note: string;
}

export interface PaperPortfolioState {
  bankroll: number;
  cash: number;
  realizedPnl: number;
  positions: PaperPosition[];
  ledger: PaperLedgerEntry[];
}
