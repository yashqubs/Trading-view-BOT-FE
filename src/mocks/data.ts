/**
 * Mock data for every API type in the application.
 * Covers all pages, all scenarios, all 16 trade statuses, P&L data.
 */
import type {
  User,
  TradingRules,
  DashboardOverview,
  DailyActivityPoint,
  StockActivity,
  StatusBreakdownPoint,
  StockStats,
  TradeLog,
  TradeSummary,
  StockMapping,
  IgMarketResult,
} from '@/types'
import { TRADE_STATUSES } from '@/types'
import type { TradeFilters, TradeListResponse, TradeSortBy } from '@/api/trades'
import type { SystemStatus } from '@/api/system'
import type { TwoFactorSetup } from '@/api/auth'

// ─── Users ───────────────────────────────────────────────────────────────────

export const MOCK_ADMIN_USER: User = {
  id: 'user-1',
  name: 'Alex Mercer',
  email: 'alex@tradingbot.io',
  role: 'ADMIN',
  active: true,
  twoFactorEnabled: false,
  mustChangePassword: false,
  lastLoginAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  createdAt: '2025-01-15T10:00:00.000Z',
}

export const MOCK_VIEWER_USER: User = {
  id: 'user-2',
  name: 'Sam Rivera',
  email: 'sam@tradingbot.io',
  role: 'VIEWER',
  active: true,
  twoFactorEnabled: true,
  mustChangePassword: false,
  lastLoginAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  createdAt: '2025-03-20T09:15:00.000Z',
}

export const MOCK_INACTIVE_USER: User = {
  id: 'user-3',
  name: 'Jordan Park',
  email: 'jordan@tradingbot.io',
  role: 'VIEWER',
  active: false,
  twoFactorEnabled: false,
  mustChangePassword: true,
  lastLoginAt: null,
  createdAt: '2025-06-01T08:00:00.000Z',
}

export const MOCK_USERS: User[] = [MOCK_ADMIN_USER, MOCK_VIEWER_USER, MOCK_INACTIVE_USER]
export const MOCK_ME: User = MOCK_ADMIN_USER

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const MOCK_2FA_SETUP: TwoFactorSetup = {
  message: 'A 6-digit verification code has been sent to your email.',
  maskedEmail: 'a***@tradingbot.io',
}

// ─── System Status ────────────────────────────────────────────────────────────

export const MOCK_SYSTEM_STATUS: SystemStatus = {
  webhookUrl: 'https://api.tradingbot.io/webhook/abc123xyz',
  igConnected: true,
  igSessionExpiresAt: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
}

// ─── Trading Rules ────────────────────────────────────────────────────────────

export const MOCK_TRADING_RULES: TradingRules = {
  id: 1,
  botEnabled: true,
  allowBuy: true,
  allowSell: true,
  dailyMaxTotalInvestment: 5000,
  dailyMaxTradeCount: 20,
  maxOpenPositionsGlobal: 10,
  maxConsecutiveFailures: 5,
  consecutiveFailureCount: 1,
  tradeStartTimeUtc: '08:00',
  tradeEndTimeUtc: '16:30',
  tradeWeekdaysOnly: true,
  updatedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
  updatedBy: 'Alex Mercer',
}

// ─── Stock Mappings ───────────────────────────────────────────────────────────

export const MOCK_STOCKS: StockMapping[] = [
  {
    id: 1,
    tvTicker: 'AAPL',
    igEpic: 'IX.D.AAPL.DAILY.IP',
    instrumentName: 'Apple Inc',
    instrumentType: 'SHARES',
    enabled: true,
    investmentAmount: 500,
    maxDailySpend: 1500,
    coolDownMinutes: 60,
    maxOpenPositions: 3,
    createdAt: '2025-01-20T10:00:00.000Z',
    updatedAt: '2025-06-01T08:30:00.000Z',
  },
  {
    id: 2,
    tvTicker: 'TSLA',
    igEpic: 'IX.D.TSLA.DAILY.IP',
    instrumentName: 'Tesla Inc',
    instrumentType: 'SHARES',
    enabled: true,
    investmentAmount: 750,
    maxDailySpend: 2000,
    coolDownMinutes: 30,
    maxOpenPositions: 2,
    createdAt: '2025-02-10T11:00:00.000Z',
    updatedAt: '2025-06-10T09:00:00.000Z',
  },
  {
    id: 3,
    tvTicker: 'NVDA',
    igEpic: 'IX.D.NVDA.DAILY.IP',
    instrumentName: 'NVIDIA Corp',
    instrumentType: 'SHARES',
    enabled: true,
    investmentAmount: 1000,
    maxDailySpend: 3000,
    coolDownMinutes: 45,
    maxOpenPositions: 3,
    createdAt: '2025-03-05T09:00:00.000Z',
    updatedAt: '2025-06-15T12:00:00.000Z',
  },
  {
    id: 4,
    tvTicker: 'MSFT',
    igEpic: 'IX.D.MSFT.DAILY.IP',
    instrumentName: 'Microsoft Corp',
    instrumentType: 'SHARES',
    enabled: false,
    investmentAmount: 600,
    maxDailySpend: null,
    coolDownMinutes: null,
    maxOpenPositions: 2,
    createdAt: '2025-04-01T10:00:00.000Z',
    updatedAt: '2025-06-20T14:00:00.000Z',
  },
  {
    id: 5,
    tvTicker: 'AMZN',
    igEpic: 'IX.D.AMZN.DAILY.IP',
    instrumentName: 'Amazon.com Inc',
    instrumentType: 'SHARES',
    enabled: true,
    investmentAmount: 800,
    maxDailySpend: 2400,
    coolDownMinutes: 60,
    maxOpenPositions: 3,
    createdAt: '2025-04-15T10:00:00.000Z',
    updatedAt: '2025-06-25T10:00:00.000Z',
  },
]

// ─── IG Market Search ─────────────────────────────────────────────────────────

export const MOCK_IG_SEARCH_RESULTS: IgMarketResult[] = [
  {
    epic: 'IX.D.GOOGL.DAILY.IP',
    instrumentName: 'Alphabet Inc (Google) Class A',
    instrumentType: 'SHARES',
    marketStatus: 'TRADEABLE',
    bid: 175.42,
    offer: 175.58,
  },
  {
    epic: 'IX.D.META.DAILY.IP',
    instrumentName: 'Meta Platforms Inc',
    instrumentType: 'SHARES',
    marketStatus: 'TRADEABLE',
    bid: 561.20,
    offer: 561.80,
  },
  {
    epic: 'IX.D.NFLX.DAILY.IP',
    instrumentName: 'Netflix Inc',
    instrumentType: 'SHARES',
    marketStatus: 'CLOSED',
    bid: null,
    offer: null,
  },
]

// ─── Dashboard Overview ───────────────────────────────────────────────────────

export const MOCK_OVERVIEW: DashboardOverview = {
  botEnabled: true,
  autoPaused: false,
  totalTrades: 1842,
  todaysTrades: 14,
  todaysInvested: 9350.00,
  dailyMaxTotalInvestment: 20000,
  dailyMaxTradeCount: 50,
  openPositions: 7,
  successRate: 87.3,
  consecutiveFailures: 1,
  buyCount: 1104,
  sellCount: 738,
}

// ─── Daily Activity ───────────────────────────────────────────────────────────

function daysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().split('T')[0]
}

export const MOCK_DAILY_ACTIVITY: DailyActivityPoint[] = Array.from({ length: 30 }, (_, i) => {
  const isWeekend = [0, 6].includes(new Date(daysAgo(29 - i)).getDay())
  const trades = isWeekend ? 0 : Math.floor(Math.random() * 18) + 3
  return {
    date: daysAgo(29 - i),
    trades,
    invested: trades * (300 + Math.floor(Math.random() * 700)),
  }
})

export const MOCK_BY_STOCK: StockActivity[] = [
  { tvTicker: 'NVDA', trades: 412, invested: 412000 },
  { tvTicker: 'TSLA', trades: 388, invested: 291000 },
  { tvTicker: 'AAPL', trades: 320, invested: 160000 },
  { tvTicker: 'AMZN', trades: 410, invested: 328000 },
  { tvTicker: 'MSFT', trades: 312, invested: 187200 },
]

export const MOCK_STATUS_BREAKDOWN: StatusBreakdownPoint[] = [
  { status: 'SUCCESS', count: 1608 },
  { status: 'FAILED', count: 72 },
  { status: 'MARKET_CLOSED', count: 48 },
  { status: 'NOT_MAPPED', count: 12 },
  { status: 'DISABLED', count: 24 },
  { status: 'NO_POSITION', count: 18 },
  { status: 'BOT_PAUSED', count: 10 },
  { status: 'BUY_DISABLED', count: 8 },
  { status: 'SELL_DISABLED', count: 6 },
  { status: 'DAILY_TOTAL_LIMIT', count: 14 },
  { status: 'DAILY_TRADE_LIMIT', count: 9 },
  { status: 'GLOBAL_POSITION_LIMIT', count: 5 },
  { status: 'STOCK_DAILY_LIMIT', count: 4 },
  { status: 'COOL_DOWN', count: 3 },
  { status: 'MAX_POSITIONS_STOCK', count: 1 },
  { status: 'AUTO_PAUSED', count: 0 },
]

function makeStockStats(ticker: string): StockStats {
  return {
    tvTicker: ticker,
    totalTrades: 388,
    totalInvested: 291000,
    buyCount: 220,
    sellCount: 168,
    successRate: 91.2,
    lastTradedAt: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
    currentlyOpen: true,
    timeline: Array.from({ length: 30 }, (_, i) => ({
      date: daysAgo(29 - i),
      trades: [0, 6].includes(new Date(daysAgo(29 - i)).getDay())
        ? 0
        : Math.floor(Math.random() * 14) + 1,
    })),
    entryPrices: Array.from({ length: 30 }, (_, i) => ({
      date: daysAgo(29 - i),
      price: 220 + Math.sin(i * 0.4) * 30 + Math.random() * 15,
    })),
    statusBreakdown: [
      { status: 'SUCCESS', count: 354 },
      { status: 'FAILED', count: 18 },
      { status: 'MARKET_CLOSED', count: 10 },
      { status: 'COOL_DOWN', count: 6 },
    ],
    investedOverTime: Array.from({ length: 30 }, (_, i) => ({
      date: daysAgo(29 - i),
      invested: [0, 6].includes(new Date(daysAgo(29 - i)).getDay())
        ? 0
        : 750 * (Math.floor(Math.random() * 12) + 1),
    })),
  }
}

export const MOCK_STOCK_STATS: Record<string, StockStats> = {
  AAPL: makeStockStats('AAPL'),
  TSLA: makeStockStats('TSLA'),
  NVDA: makeStockStats('NVDA'),
  MSFT: makeStockStats('MSFT'),
  AMZN: makeStockStats('AMZN'),
}

// ─── Trade Logs ───────────────────────────────────────────────────────────────

const TICKERS = ['AAPL', 'TSLA', 'NVDA', 'MSFT', 'AMZN']
const EPICS: Record<string, string> = {
  AAPL: 'IX.D.AAPL.DAILY.IP',
  TSLA: 'IX.D.TSLA.DAILY.IP',
  NVDA: 'IX.D.NVDA.DAILY.IP',
  MSFT: 'IX.D.MSFT.DAILY.IP',
  AMZN: 'IX.D.AMZN.DAILY.IP',
}

// Seeded deterministic random to keep data stable across re-renders
function seeded(seed: number) {
  const x = Math.sin(seed + 1) * 10000
  return x - Math.floor(x)
}

function makePnL(
  seed: number,
  isSuccess: boolean,
  direction: 'BUY' | 'SELL',
  signalPrice: number,
  investmentAmount: number | null,
  quantity: number | null,
): { closingPrice: number | null; profitLoss: number | null; profitLossPct: number | null } {
  if (!isSuccess || investmentAmount === null || quantity === null) {
    return { closingPrice: null, profitLoss: null, profitLossPct: null }
  }
  // ~30% of successful trades are still open (no closing price yet)
  if (seeded(seed * 7) < 0.3) {
    return { closingPrice: null, profitLoss: null, profitLossPct: null }
  }
  // Price movement: ±6%, skewed slightly positive (60% win rate)
  const pricePct = (seeded(seed * 3) - 0.40) * 0.12
  const closingPrice = parseFloat((signalPrice * (1 + pricePct)).toFixed(2))
  const rawPnL = direction === 'BUY'
    ? (closingPrice - signalPrice) * quantity
    : (signalPrice - closingPrice) * quantity
  const profitLoss = parseFloat(rawPnL.toFixed(2))
  const profitLossPct = parseFloat(((profitLoss / investmentAmount) * 100).toFixed(2))
  return { closingPrice, profitLoss, profitLossPct }
}

function randomId(seed: number, prefix: string) {
  return `${prefix}${Math.abs(Math.floor(seeded(seed) * 0xFFFFFF)).toString(16).toUpperCase().padStart(6, '0')}`
}

function hoursAgo(h: number) {
  return new Date(Date.now() - h * 60 * 60 * 1000).toISOString()
}

// One trade per status so every badge is exercised
const ALL_STATUS_TRADES: TradeLog[] = TRADE_STATUSES.map((status, i) => {
  const ticker = TICKERS[i % TICKERS.length]
  const isSuccess = status === 'SUCCESS'
  const direction: 'BUY' | 'SELL' = i % 2 === 0 ? 'BUY' : 'SELL'
  const signalPrice = 150 + i * 10
  const signalAt = hoursAgo(i * 2 + 1)
  const investmentAmount = isSuccess ? 500 + i * 50 : null
  const quantity = isSuccess && investmentAmount ? Math.floor(investmentAmount / signalPrice) : null
  const { closingPrice, profitLoss, profitLossPct } = makePnL(i, isSuccess, direction, signalPrice, investmentAmount, quantity)
  return {
    id: i + 1,
    tvTicker: ticker,
    igEpic: isSuccess ? EPICS[ticker] : null,
    direction,
    signalPrice,
    investmentAmount,
    quantity,
    dealReference: isSuccess ? randomId(i * 11, 'DRF') : null,
    dealId: isSuccess ? randomId(i * 13, 'DID') : null,
    status,
    skipReason: status !== 'SUCCESS' && status !== 'FAILED' ? `Skipped: ${status}` : null,
    errorMessage: status === 'FAILED' ? 'IG API returned 503 Service Unavailable' : null,
    signalReceivedAt: signalAt,
    executedAt: isSuccess ? new Date(new Date(signalAt).getTime() + 800).toISOString() : null,
    createdAt: signalAt,
    closingPrice,
    profitLoss,
    profitLossPct,
  }
})

// Bulk trades (100 trades, mix of statuses, varied P&L)
const BULK_TRADES: TradeLog[] = Array.from({ length: 100 }, (_, i) => {
  const ticker = TICKERS[i % TICKERS.length]
  const s = seeded(i * 17)
  const status = s < 0.08 ? 'FAILED' : s < 0.13 ? 'MARKET_CLOSED' : s < 0.16 ? 'COOL_DOWN' : s < 0.19 ? 'DISABLED' : 'SUCCESS'
  const isSuccess = status === 'SUCCESS'
  const direction: 'BUY' | 'SELL' = i % 2 === 0 ? 'BUY' : 'SELL'
  const signalPrice = parseFloat((150 + (i % 30) * 5 + seeded(i * 5) * 3).toFixed(2))
  const signalAt = hoursAgo(i * 0.5 + 1)
  const investmentAmount = isSuccess ? 500 + (i % 5) * 100 : null
  const quantity = isSuccess && investmentAmount ? parseFloat((investmentAmount / signalPrice).toFixed(4)) : null
  const { closingPrice, profitLoss, profitLossPct } = makePnL(i + 100, isSuccess, direction, signalPrice, investmentAmount, quantity)
  return {
    id: 100 + i,
    tvTicker: ticker,
    igEpic: EPICS[ticker],
    direction,
    signalPrice,
    investmentAmount,
    quantity,
    dealReference: isSuccess ? randomId((i + 100) * 11, 'DRF') : null,
    dealId: isSuccess ? randomId((i + 100) * 13, 'DID') : null,
    status,
    skipReason: status !== 'SUCCESS' && status !== 'FAILED' ? `Skipped: ${status}` : null,
    errorMessage: status === 'FAILED' ? 'Order rejected by IG' : null,
    signalReceivedAt: signalAt,
    executedAt: isSuccess ? new Date(new Date(signalAt).getTime() + 650).toISOString() : null,
    createdAt: signalAt,
    closingPrice,
    profitLoss,
    profitLossPct,
  }
})

export const ALL_MOCK_TRADES: TradeLog[] = [...ALL_STATUS_TRADES, ...BULK_TRADES]

// ─── Summary computation ──────────────────────────────────────────────────────

function computeSummary(trades: TradeLog[]): TradeSummary {
  const successCount = trades.filter((t) => t.status === 'SUCCESS').length
  const failedCount = trades.filter((t) => t.status === 'FAILED').length
  const skippedCount = trades.filter(
    (t) => t.status !== 'SUCCESS' && t.status !== 'FAILED',
  ).length
  const buyCount = trades.filter((t) => t.direction === 'BUY').length
  const sellCount = trades.filter((t) => t.direction === 'SELL').length
  const totalInvested = trades.reduce((s, t) => s + (t.investmentAmount ?? 0), 0)
  const closedTrades = trades.filter((t) => t.profitLoss !== null)
  const totalProfitLoss =
    closedTrades.length > 0 ? closedTrades.reduce((s, t) => s + (t.profitLoss ?? 0), 0) : null
  const avgProfitLoss =
    closedTrades.length > 0 ? (totalProfitLoss ?? 0) / closedTrades.length : null
  const winCount = closedTrades.filter((t) => (t.profitLoss ?? 0) > 0).length
  const lossCount = closedTrades.filter((t) => (t.profitLoss ?? 0) < 0).length
  const executedTrades = trades.filter((t) => t.investmentAmount !== null)
  const avgInvestment =
    executedTrades.length > 0
      ? executedTrades.reduce((s, t) => s + (t.investmentAmount ?? 0), 0) / executedTrades.length
      : null

  return {
    totalTrades: trades.length,
    successCount,
    failedCount,
    skippedCount,
    buyCount,
    sellCount,
    totalInvested,
    totalProfitLoss,
    avgProfitLoss,
    successRate: trades.length > 0 ? (successCount / trades.length) * 100 : 0,
    avgInvestment,
    winCount,
    lossCount,
  }
}

// ─── Mock trade list with sort + filter ──────────────────────────────────────

export function getMockTradesPage(filters: TradeFilters = {}): TradeListResponse {
  const page = filters.page ?? 1
  const pageSize = filters.pageSize ?? 25

  let filtered = [...ALL_MOCK_TRADES]

  // Filtering
  if (filters.ticker) {
    const t = filters.ticker.toUpperCase()
    filtered = filtered.filter((tr) => tr.tvTicker.includes(t))
  }
  if (filters.direction) filtered = filtered.filter((t) => t.direction === filters.direction)
  if (filters.status) filtered = filtered.filter((t) => t.status === filters.status)
  if (filters.from) {
    const from = new Date(filters.from).getTime()
    filtered = filtered.filter((t) => new Date(t.signalReceivedAt).getTime() >= from)
  }
  if (filters.to) {
    // Include full day
    const to = new Date(filters.to).getTime() + 86400000
    filtered = filtered.filter((t) => new Date(t.signalReceivedAt).getTime() < to)
  }

  // Sorting
  const sortBy: TradeSortBy = filters.sortBy ?? 'signalReceivedAt'
  const sortOrder = filters.sortOrder ?? 'desc'
  filtered.sort((a, b) => {
    let av: number | string | null
    let bv: number | string | null
    switch (sortBy) {
      case 'signalReceivedAt': av = a.signalReceivedAt; bv = b.signalReceivedAt; break
      case 'executedAt': av = a.executedAt ?? ''; bv = b.executedAt ?? ''; break
      case 'signalPrice': av = a.signalPrice; bv = b.signalPrice; break
      case 'investmentAmount': av = a.investmentAmount ?? -1; bv = b.investmentAmount ?? -1; break
      case 'profitLoss': av = a.profitLoss ?? -Infinity; bv = b.profitLoss ?? -Infinity; break
      case 'tvTicker': av = a.tvTicker; bv = b.tvTicker; break
      default: av = a.signalReceivedAt; bv = b.signalReceivedAt
    }
    if (av === bv) return 0
    const cmp = av < bv ? -1 : 1
    return sortOrder === 'asc' ? cmp : -cmp
  })

  const summary = computeSummary(filtered)
  const total = filtered.length
  const start = (page - 1) * pageSize
  const items = filtered.slice(start, start + pageSize)

  return { items, total, summary }
}
