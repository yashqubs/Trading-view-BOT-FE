/**
 * MSW request handlers — every API endpoint used by the application.
 * GET endpoints return mock data. Mutations simulate success.
 */
import { http, HttpResponse, delay } from 'msw'
import {
  MOCK_ME,
  MOCK_USERS,
  MOCK_ADMIN_USER,
  MOCK_2FA_SETUP,
  MOCK_SYSTEM_STATUS,
  MOCK_TRADING_RULES,
  MOCK_STOCKS,
  MOCK_IG_SEARCH_RESULTS,
  MOCK_OVERVIEW,
  MOCK_DAILY_ACTIVITY,
  MOCK_BY_STOCK,
  MOCK_OPEN_POSITIONS,
  MOCK_STATUS_BREAKDOWN,
  MOCK_STOCK_STATS,
  getMockTradesPage,
} from './data'
import type { TradeFilters } from '@/api/trades'
import type { TradingRules } from '@/types'

// Shared latency to make loading states visible
const LATENCY = 400

// Mutable in-memory state so mutations actually reflect in subsequent GETs
let mockRules: TradingRules = { ...MOCK_TRADING_RULES }

const BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000'

function url(path: string) {
  return `${BASE}${path}`
}

export const handlers = [
  // ─── Auth ────────────────────────────────────────────────────────────────────

  // GET /auth/me — always returns the mock admin user (logged-in state)
  http.get(url('/auth/me'), async () => {
    await delay(LATENCY)
    return HttpResponse.json(MOCK_ME)
  }),

  // POST /auth/login — simulate success; frontend falls through to GET /auth/me
  http.post(url('/auth/login'), async () => {
    await delay(LATENCY)
    return HttpResponse.json({ requiresPasswordChange: false, requires2fa: false, user: MOCK_ME })
  }),

  // POST /auth/login/2fa
  http.post(url('/auth/login/2fa'), async () => {
    await delay(LATENCY)
    return HttpResponse.json({ user: MOCK_ME })
  }),

  // POST /auth/login/2fa/resend
  http.post(url('/auth/login/2fa/resend'), async () => {
    await delay(LATENCY)
    return HttpResponse.json({ message: 'A new code has been sent to your email.' })
  }),

  // POST /auth/2fa/setup
  http.post(url('/auth/2fa/setup'), async () => {
    await delay(LATENCY)
    return HttpResponse.json(MOCK_2FA_SETUP)
  }),

  // POST /auth/2fa/resend
  http.post(url('/auth/2fa/resend'), async () => {
    await delay(LATENCY)
    return HttpResponse.json({ message: 'A new verification code has been sent to your email.' })
  }),

  // POST /auth/2fa/verify
  http.post(url('/auth/2fa/verify'), async () => {
    await delay(LATENCY)
    return HttpResponse.json({ user: { ...MOCK_ME, twoFactorEnabled: true } })
  }),

  // POST /auth/2fa/skip
  http.post(url('/auth/2fa/skip'), async () => {
    await delay(LATENCY)
    return HttpResponse.json({ user: MOCK_ME })
  }),

  // POST /auth/2fa/disable
  http.post(url('/auth/2fa/disable'), async () => {
    await delay(LATENCY)
    return HttpResponse.json({ user: { ...MOCK_ME, twoFactorEnabled: false } })
  }),

  // POST /auth/logout
  http.post(url('/auth/logout'), async () => {
    await delay(LATENCY)
    return HttpResponse.json({ ok: true })
  }),

  // PATCH /users/me/password
  http.patch(url('/users/me/password'), async () => {
    await delay(LATENCY)
    return HttpResponse.json({ ok: true })
  }),

  // ─── System ──────────────────────────────────────────────────────────────────

  http.get(url('/system/status'), async () => {
    await delay(LATENCY)
    return HttpResponse.json(MOCK_SYSTEM_STATUS)
  }),

  // ─── Rules ───────────────────────────────────────────────────────────────────

  http.get(url('/rules'), async () => {
    await delay(LATENCY)
    return HttpResponse.json(mockRules)
  }),

  http.patch(url('/rules'), async ({ request }) => {
    await delay(LATENCY)
    const body = await request.json() as Partial<TradingRules>
    mockRules = {
      ...mockRules,
      ...body,
      updatedAt: new Date().toISOString(),
      updatedBy: MOCK_ME.name,
    }
    return HttpResponse.json(mockRules)
  }),

  // ─── Users ───────────────────────────────────────────────────────────────────

  http.get(url('/users'), async () => {
    await delay(LATENCY)
    return HttpResponse.json(MOCK_USERS)
  }),

  http.post(url('/users'), async ({ request }) => {
    await delay(LATENCY)
    const body = await request.json() as { name: string; email: string; role: string }
    const newUser = {
      ...MOCK_ADMIN_USER,
      id: `user-${Date.now()}`,
      name: body.name ?? 'New User',
      email: body.email ?? 'newuser@tradingbot.io',
      role: body.role ?? 'VIEWER',
      active: true,
      twoFactorEnabled: false,
      mustChangePassword: true,
      lastLoginAt: null,
      createdAt: new Date().toISOString(),
    }
    return HttpResponse.json({ user: newUser, tempPassword: 'Temp@1234!' })
  }),

  http.patch(url('/users/:id'), async ({ params, request }) => {
    await delay(LATENCY)
    const body = await request.json() as Record<string, unknown>
    const user = MOCK_USERS.find((u) => u.id === params.id) ?? MOCK_USERS[0]
    return HttpResponse.json({ ...user, ...body })
  }),

  http.post(url('/users/:id/reset-password'), async () => {
    await delay(LATENCY)
    return HttpResponse.json({ tempPassword: 'NewTemp@5678!' })
  }),

  http.delete(url('/users/:id'), async () => {
    await delay(LATENCY)
    return HttpResponse.json({ ok: true })
  }),

  // ─── Stocks / Mapping ─────────────────────────────────────────────────────────

  http.get(url('/mapping'), async () => {
    await delay(LATENCY)
    return HttpResponse.json(MOCK_STOCKS)
  }),

  http.get(url('/mapping/search'), async ({ request }) => {
    await delay(LATENCY)
    const term = new URL(request.url).searchParams.get('term') ?? ''
    const results = term.trim().length > 1
      ? MOCK_IG_SEARCH_RESULTS.filter((r) =>
          r.instrumentName.toLowerCase().includes(term.toLowerCase()) ||
          r.epic.toLowerCase().includes(term.toLowerCase()),
        )
      : []
    return HttpResponse.json(results)
  }),

  http.get(url('/mapping/:ticker'), async ({ params }) => {
    await delay(LATENCY)
    const stock = MOCK_STOCKS.find((s) => s.tvTicker === String(params.ticker).toUpperCase())
    if (!stock) return HttpResponse.json({ message: 'Not found' }, { status: 404 })
    return HttpResponse.json(stock)
  }),

  http.post(url('/mapping'), async ({ request }) => {
    await delay(LATENCY)
    const body = await request.json() as Record<string, unknown>
    const newStock = {
      id: Date.now(),
      tvTicker: body.tvTicker ?? 'NEW',
      igEpic: body.igEpic ?? 'IX.D.NEW.DAILY.IP',
      instrumentName: body.instrumentName ?? 'New Instrument',
      instrumentType: body.instrumentType ?? 'SHARES',
      enabled: true,
      investmentAmount: body.investmentAmount ?? 500,
      maxDailySpend: body.maxDailySpend ?? null,
      coolDownMinutes: body.coolDownMinutes ?? null,
      maxOpenPositions: body.maxOpenPositions ?? 3,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    return HttpResponse.json(newStock)
  }),

  http.patch(url('/mapping/:id'), async ({ params, request }) => {
    await delay(LATENCY)
    const body = await request.json() as Record<string, unknown>
    const stock = MOCK_STOCKS.find((s) => s.id === Number(params.id)) ?? MOCK_STOCKS[0]
    return HttpResponse.json({ ...stock, ...body, updatedAt: new Date().toISOString() })
  }),

  http.delete(url('/mapping/:id'), async () => {
    await delay(LATENCY)
    return HttpResponse.json({ ok: true })
  }),

  // ─── Stats ────────────────────────────────────────────────────────────────────

  http.get(url('/stats/overview'), async ({ request }) => {
    await delay(LATENCY)
    const sp = new URL(request.url).searchParams
    const ticker = sp.get('ticker') ?? undefined
    // Scale down numbers for single-stock views
    if (ticker) {
      const scale = 0.25
      return HttpResponse.json({
        ...MOCK_OVERVIEW,
        botEnabled: mockRules.botEnabled,
        totalTrades: Math.round(MOCK_OVERVIEW.totalTrades * scale),
        todaysTrades: Math.round(MOCK_OVERVIEW.todaysTrades * scale),
        todaysInvested: parseFloat((MOCK_OVERVIEW.todaysInvested * scale).toFixed(2)),
        openPositions: Math.max(1, Math.round(MOCK_OVERVIEW.openPositions * scale)),
        buyCount: Math.round(MOCK_OVERVIEW.buyCount * scale),
        sellCount: Math.round(MOCK_OVERVIEW.sellCount * scale),
      })
    }
    return HttpResponse.json({ ...MOCK_OVERVIEW, botEnabled: mockRules.botEnabled })
  }),

  http.get(url('/stats/daily-activity'), async ({ request }) => {
    await delay(LATENCY)
    const sp = new URL(request.url).searchParams
    const days = Number(sp.get('days') ?? 30)
    const ticker = sp.get('ticker') ?? undefined
    const sliced = MOCK_DAILY_ACTIVITY.slice(-Math.min(days, MOCK_DAILY_ACTIVITY.length))
    // For a specific ticker, reduce numbers proportionally
    if (ticker) {
      return HttpResponse.json(sliced.map((d) => ({
        ...d,
        trades: Math.round(d.trades * 0.3),
        invested: Math.round(d.invested * 0.3),
      })))
    }
    return HttpResponse.json(sliced)
  }),

  http.get(url('/stats/by-stock'), async ({ request }) => {
    await delay(LATENCY)
    const sp = new URL(request.url).searchParams
    const days = Number(sp.get('days') ?? 365)
    // Scale invested by how recent the window is
    const scale = Math.min(1, days / 90)
    return HttpResponse.json(MOCK_BY_STOCK.map((s) => ({
      ...s,
      trades: Math.round(s.trades * scale),
      invested: Math.round(s.invested * scale),
    })))
  }),

  http.get(url('/stats/open-positions'), async ({ request }) => {
    await delay(LATENCY)
    const sp = new URL(request.url).searchParams
    const ticker = sp.get('ticker') ?? undefined
    const positions = ticker ? MOCK_OPEN_POSITIONS.filter((p) => p.tvTicker === ticker) : MOCK_OPEN_POSITIONS
    return HttpResponse.json(positions)
  }),

  http.get(url('/stats/status-breakdown'), async ({ request }) => {
    await delay(LATENCY)
    const sp = new URL(request.url).searchParams
    const ticker = sp.get('ticker') ?? undefined
    const days = Number(sp.get('days') ?? 365)
    const scale = Math.min(1, days / 90) * (ticker ? 0.3 : 1)
    return HttpResponse.json(
      MOCK_STATUS_BREAKDOWN.map((s) => ({
        ...s,
        count: Math.round(s.count * scale),
      })).filter((s) => s.count > 0),
    )
  }),

  http.get(url('/stats/stock/:ticker'), async ({ params }) => {
    await delay(LATENCY)
    const ticker = String(params.ticker).toUpperCase()
    const stats = MOCK_STOCK_STATS[ticker]
    if (!stats) return HttpResponse.json({ message: 'Not found' }, { status: 404 })
    return HttpResponse.json(stats)
  }),

  // ─── Trades ───────────────────────────────────────────────────────────────────

  http.get(url('/trades'), async ({ request }) => {
    await delay(LATENCY)
    const sp = new URL(request.url).searchParams
    const filters: TradeFilters = {
      ticker: sp.get('ticker') ?? undefined,
      direction: (sp.get('direction') as TradeFilters['direction']) ?? undefined,
      status: (sp.get('status') as TradeFilters['status']) ?? undefined,
      from: sp.get('from') ?? undefined,
      to: sp.get('to') ?? undefined,
      sortBy: (sp.get('sortBy') as TradeFilters['sortBy']) ?? undefined,
      sortOrder: (sp.get('sortOrder') as TradeFilters['sortOrder']) ?? undefined,
      page: sp.has('page') ? Number(sp.get('page')) : undefined,
      pageSize: sp.has('pageSize') ? Number(sp.get('pageSize')) : undefined,
    }
    return HttpResponse.json(getMockTradesPage(filters))
  }),

  // GET /trades/export — rich CSV with P&L columns
  http.get(url('/trades/export'), async ({ request }) => {
    await delay(LATENCY)
    const sp = new URL(request.url).searchParams
    const filters: TradeFilters = {
      ticker: sp.get('ticker') ?? undefined,
      direction: (sp.get('direction') as TradeFilters['direction']) ?? undefined,
      status: (sp.get('status') as TradeFilters['status']) ?? undefined,
      from: sp.get('from') ?? undefined,
      to: sp.get('to') ?? undefined,
      sortBy: (sp.get('sortBy') as TradeFilters['sortBy']) ?? undefined,
      sortOrder: (sp.get('sortOrder') as TradeFilters['sortOrder']) ?? undefined,
      pageSize: 10000,
    }
    const header = 'id,ticker,direction,status,signalPrice,closingPrice,quantity,investmentAmount,profitLoss,profitLossPct,dealId,signalReceivedAt,executedAt\n'
    const rows = getMockTradesPage(filters)
      .items.map((t) =>
        [
          t.id,
          t.tvTicker,
          t.direction,
          t.status,
          t.signalPrice.toFixed(2),
          t.closingPrice?.toFixed(2) ?? '',
          t.quantity ?? '',
          t.investmentAmount ?? '',
          t.profitLoss?.toFixed(2) ?? '',
          t.profitLossPct?.toFixed(2) ?? '',
          t.dealId ?? '',
          t.signalReceivedAt,
          t.executedAt ?? '',
        ].join(','),
      )
      .join('\n')
    const csv = header + rows
    return new HttpResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="trades.csv"',
      },
    })
  }),
]
