export type Role = 'ADMIN' | 'VIEWER'

export interface User {
  id: string
  name: string
  email: string
  role: Role
  active: boolean
  twoFactorEnabled: boolean
  mustChangePassword: boolean
  lastLoginAt: string | null
  createdAt: string
}

export type TradeDirection = 'BUY' | 'SELL'

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
] as const

export type TradeStatus = (typeof TRADE_STATUSES)[number]

export interface TradeLog {
  id: number
  tvTicker: string
  igEpic: string | null
  direction: TradeDirection
  signalPrice: number
  investmentAmount: number | null
  quantity: number | null
  dealReference: string | null
  dealId: string | null
  status: TradeStatus
  skipReason: string | null
  errorMessage: string | null
  signalReceivedAt: string
  executedAt: string | null
  createdAt: string
  /** Price when the position was closed. Null if still open or not executed. */
  closingPrice: number | null
  /** Realized P&L in GBP. Null if position is still open or trade was not executed. */
  profitLoss: number | null
  /** Realized P&L as percentage of invested amount. */
  profitLossPct: number | null
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
  totalProfitLoss: number | null
  avgProfitLoss: number | null
  successRate: number
  avgInvestment: number | null
  winCount: number
  lossCount: number
}

export interface StockMapping {
  id: number
  tvTicker: string
  igEpic: string
  instrumentName: string
  instrumentType: string
  enabled: boolean
  investmentAmount: number
  maxDailySpend: number | null
  coolDownMinutes: number | null
  maxOpenPositions: number
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
  allowBuy: boolean
  allowSell: boolean
  dailyMaxTotalInvestment: number | null
  dailyMaxTradeCount: number | null
  maxOpenPositionsGlobal: number | null
  maxConsecutiveFailures: number
  consecutiveFailureCount: number
  tradeStartTimeUtc: string
  tradeEndTimeUtc: string
  tradeWeekdaysOnly: boolean
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
