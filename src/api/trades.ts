import { api } from './axios'
import type { TradeDirection, TradeLog, TradeStatus, TradeSummary } from '@/types'

export type TradeSortBy =
  | 'signalReceivedAt'
  | 'executedAt'
  | 'signalPrice'
  | 'tradeValue'
  | 'tvTicker'

export interface TradeFilters {
  ticker?: string
  direction?: TradeDirection
  status?: TradeStatus
  from?: string
  to?: string
  sortBy?: TradeSortBy
  sortOrder?: 'asc' | 'desc'
  page?: number
  pageSize?: number
}

export interface TradeListResponse {
  items: TradeLog[]
  total: number
  summary: TradeSummary
}

export function listTrades(filters: TradeFilters = {}) {
  return api.get<TradeListResponse>('/trades', { params: filters }).then((r) => r.data)
}

export interface CloseAllFailure {
  tvTicker: string
  igEpic: string
  /** Raw IG error code — run it through describeTradeError for a readable line. */
  reason: string
}

export interface CloseAllPositionsResult {
  /** How many positions IG held when the request started. */
  attempted: number
  closed: number
  failures: CloseAllFailure[]
}

/**
 * Closes every position open on IG at market price. A partial result is a
 * normal outcome (one instrument halted, say), so this resolves with a summary
 * rather than rejecting — only a transport/auth failure rejects.
 */
export function closeAllPositions() {
  return api.post<CloseAllPositionsResult>('/trades/close-all-positions').then((r) => r.data)
}

export function exportTradesCsv(filters: TradeFilters = {}) {
  return api
    .get<Blob>('/trades/export', { params: filters, responseType: 'blob' })
    .then((r) => r.data)
}
