import { api } from './axios'
import type {
  DailyActivityPoint,
  DashboardOverview,
  StatusBreakdownPoint,
  StockActivity,
  StockStats,
} from '@/types'

export function getOverview() {
  return api.get<DashboardOverview>('/stats/overview').then((r) => r.data)
}

export function getDailyActivity(days = 30) {
  return api
    .get<DailyActivityPoint[]>('/stats/daily-activity', { params: { days } })
    .then((r) => r.data)
}

export function getByStock() {
  return api.get<StockActivity[]>('/stats/by-stock').then((r) => r.data)
}

export function getStatusBreakdown() {
  return api.get<StatusBreakdownPoint[]>('/stats/status-breakdown').then((r) => r.data)
}

export function getStockStats(ticker: string) {
  return api.get<StockStats>(`/stats/stock/${ticker}`).then((r) => r.data)
}
