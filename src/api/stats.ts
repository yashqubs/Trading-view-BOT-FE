import { api } from './axios'
import type {
  DailyActivityPoint,
  DashboardOverview,
  StatusBreakdownPoint,
  StockActivity,
  StockStats,
} from '@/types'

/** Shared filter applied to all chart endpoints. */
export interface StatsFilters {
  days?: number
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

export function getStockStats(ticker: string) {
  return api.get<StockStats>(`/stats/stock/${ticker}`).then((r) => r.data)
}
