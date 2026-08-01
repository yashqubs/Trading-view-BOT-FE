import { api } from './axios'
import type { TradeDirection, TradeLog, TradeStatus, TradeSummary } from '@/types'

export type TradeSortBy =
  | 'signalReceivedAt'
  | 'executedAt'
  | 'positionOpenedAt'
  | 'signalPrice'
  | 'tradeValue'
  | 'tvTicker'

export interface TradeFilters {
  ticker?: string
  direction?: TradeDirection
  /** A single status, or several — the portal's default "executed only" view
   * sends [SUCCESS, FAILED] as one request. Serialized as a comma-separated
   * string on the wire (see toQueryParams); the backend DTO normalizes both
   * shapes into an IN(...) filter either way. */
  status?: TradeStatus | TradeStatus[]
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

// Axios has no opinion on how to serialize an array query param, and this
// repo doesn't configure a paramsSerializer — so array vs. single-value
// `status` would otherwise hit the wire in an unpredictable shape. Joining
// to a comma-separated string here keeps it unambiguous and matches exactly
// what TradeLogQueryDto.status expects.
function toQueryParams(filters: TradeFilters) {
  return {
    ...filters,
    status: Array.isArray(filters.status) ? filters.status.join(',') : filters.status,
  }
}

export function listTrades(filters: TradeFilters = {}) {
  return api.get<TradeListResponse>('/trades', { params: toQueryParams(filters) }).then((r) => r.data)
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
    .get<Blob>('/trades/export', { params: toQueryParams(filters), responseType: 'blob' })
    .then((r) => r.data)
}
