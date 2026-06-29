import { useQuery } from '@tanstack/react-query'
import {
  getByStock,
  getDailyActivity,
  getOverview,
  getStatusBreakdown,
  getStockStats,
  type StatsFilters,
} from '@/api/stats'

export function useOverview(filters: StatsFilters = {}) {
  return useQuery({
    queryKey: ['stats', 'overview', filters],
    queryFn: () => getOverview(filters),
    refetchInterval: 30_000,
  })
}

export function useDailyActivity(filters: StatsFilters = {}) {
  return useQuery({
    queryKey: ['stats', 'daily-activity', filters],
    queryFn: () => getDailyActivity(filters),
  })
}

export function useByStock(filters: StatsFilters = {}) {
  return useQuery({
    queryKey: ['stats', 'by-stock', filters],
    queryFn: () => getByStock(filters),
  })
}

export function useStatusBreakdown(filters: StatsFilters = {}) {
  return useQuery({
    queryKey: ['stats', 'status-breakdown', filters],
    queryFn: () => getStatusBreakdown(filters),
  })
}

export function useStockStats(ticker: string) {
  return useQuery({
    queryKey: ['stats', 'stock', ticker],
    queryFn: () => getStockStats(ticker),
  })
}
