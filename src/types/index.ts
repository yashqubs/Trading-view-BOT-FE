export interface User {
  id: string
  name: string
  email: string
  active: boolean
  twoFactorEnabled: boolean
  mustChangePassword: boolean
  lastLoginAt: string | null
  createdAt: string
}

export type TradeDirection = 'BUY' | 'SELL'

/** MARKET fills immediately at IG's current price (default). SIGNAL_PRICE
 * places a LIMIT order at the exact TradingView signal price — it only
 * fills at that price or better, so it can go unfilled if the market has
 * already moved past it (logged FAILED the same as a rejected market order,
 * there's no pending/working-order state). */
export const EXECUTION_MODES = ['MARKET', 'SIGNAL_PRICE'] as const
export type ExecutionMode = (typeof EXECUTION_MODES)[number]

export const TRADE_STATUSES = [
  'SUCCESS',
  'FAILED',
  'MARKET_CLOSED',
  'NOT_MAPPED',
  'DISABLED',
  'NO_POSITION',
  'BOT_PAUSED',
  'BUY_DISABLED',
  'SELL_DISABLED',
  'DAILY_TOTAL_LIMIT',
  'DAILY_TRADE_LIMIT',
  'GLOBAL_POSITION_LIMIT',
  'STOCK_DAILY_LIMIT',
  'COOL_DOWN',
  'MAX_POSITIONS_STOCK',
  'AUTO_PAUSED',
  'DUPLICATE_SIGNAL',
] as const

export type TradeStatus = (typeof TRADE_STATUSES)[number]

export interface TradeLog {
  id: number
  tvTicker: string
  igEpic: string | null
  direction: TradeDirection
  signalPrice: number
  /** Actual IG fill price. Orders are placed at market, not limit, so this
   * can legitimately differ from signalPrice. Null unless status is SUCCESS. */
  executedPrice: number | null
  investmentAmount: number | null
  quantity: number | null
  /** Slippage tolerance applied to this trade's LIMIT level, recorded at
   * execution time. Null for MARKET-mode trades (no tolerance applies) and
   * rows that never reached execution. */
  maxSlippagePercent: number | null
  dealReference: string | null
  dealId: string | null
  status: TradeStatus
  skipReason: string | null
  errorMessage: string | null
  signalReceivedAt: string
  executedAt: string | null
  createdAt: string
}

/** Aggregate statistics computed over the current filter set. */
export interface TradeSummary {
  totalTrades: number
  successCount: number
  failedCount: number
  skippedCount: number
  buyCount: number
  sellCount: number
  totalInvested: number
  successRate: number
  avgInvestment: number | null
}

export interface StockMapping {
  id: number
  tvTicker: string
  igEpic: string
  instrumentName: string
  instrumentType: string
  enabled: boolean
  /** Null = inherit TradingRules.investmentAmount (the global default). */
  investmentAmount: number | null
  maxDailySpend: number | null
  /** Null = inherit TradingRules.executionMode (the global default). */
  executionMode: ExecutionMode | null
  /** Null = inherit TradingRules.maxSlippagePercent. Independent of executionMode. */
  maxSlippagePercent: number | null
  createdAt: string
  updatedAt: string
}

export interface IgMarketResult {
  epic: string
  instrumentName: string
  instrumentType: string
  marketStatus: string
  bid: number | null
  offer: number | null
}

export interface TradingRules {
  id: number
  botEnabled: boolean
  autoPaused: boolean
  allowBuy: boolean
  allowSell: boolean
  dailyMaxTotalInvestment: number | null
  dailyMaxTradeCount: number | null
  /** Global default investment per trade. Always set — a stock's own investmentAmount overrides it when non-null. */
  investmentAmount: number
  maxConsecutiveFailures: number
  consecutiveFailureCount: number
  executionMode: ExecutionMode
  /** Only applies in SIGNAL_PRICE mode. 0 = exact signal price only. */
  maxSlippagePercent: number
  updatedAt: string
  updatedBy: string | null
}

export interface DashboardOverview {
  botEnabled: boolean
  autoPaused: boolean
  totalTrades: number
  todaysTrades: number
  todaysInvested: number
  dailyMaxTotalInvestment: number | null
  dailyMaxTradeCount: number | null
  openPositions: number
  successRate: number
  consecutiveFailures: number
  buyCount: number
  sellCount: number
}

export interface DailyActivityPoint {
  date: string
  trades: number
  invested: number
}

export interface StockActivity {
  tvTicker: string
  trades: number
  invested: number
}

export interface OpenPosition {
  tvTicker: string
  instrumentName: string
  igEpic: string
  direction: TradeDirection
  size: number
  /** False if IG reports a position for an epic with no (or no longer active) stock mapping. */
  mapped: boolean
}

export interface StatusBreakdownPoint {
  status: TradeStatus
  count: number
}

export interface StockStats {
  tvTicker: string
  totalTrades: number
  totalInvested: number
  buyCount: number
  sellCount: number
  successRate: number
  lastTradedAt: string | null
  currentlyOpen: boolean
  timeline: { date: string; trades: number }[]
  entryPrices: { date: string; price: number }[]
  statusBreakdown: StatusBreakdownPoint[]
  investedOverTime: { date: string; invested: number }[]
}
