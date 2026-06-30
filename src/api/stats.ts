import { api } from './axios'
import type {
  DailyActivityPoint,
  DashboardOverview,
  StatusBreakdownPoint,
  StockActivity,
  StockStats,
} from '@/types'

/**
 * Shared filter applied to all chart endpoints.
 * Prefer `from`/`to` (exact YYYY-MM-DD calendar dates) when known — the
 * backend uses them and ignores `days` if both are present. `days` (last
 * N days counting back from today) is the fallback for relative presets.
 */
export interface StatsFilters {
  days?: number
  from?: string
  to?: string
  ticker?: string
}

export function getOverview(filters: StatsFilters = {}) {
  return api.get<DashboardOverview>('/stats/overview', { params: filters }).then((r) => r.data)
}

export function getDailyActivity(filters: StatsFilters = {}) {
  return api
    .get<DailyActivityPoint[]>('/stats/daily-activity', { params: { days: 30, ...filters } })
    .then((r) => r.data)
}

export function getByStock(filters: StatsFilters = {}) {
  return api.get<StockActivity[]>('/stats/by-stock', { params: filters }).then((r) => r.data)
}

export function getStatusBreakdown(filters: StatsFilters = {}) {
  return api
    .get<StatusBreakdownPoint[]>('/stats/status-breakdown', { params: filters })
    .then((r) => r.data)
}

export interface StockStatsFilters {
  from?: string
  to?: string
}

export function getStockStats(ticker: string, filters: StockStatsFilters = {}) {
  return api.get<StockStats>(`/stats/stock/${ticker}`, { params: filters }).then((r) => r.data)
}
