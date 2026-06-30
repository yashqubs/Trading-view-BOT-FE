import { useQuery } from '@tanstack/react-query'
import {
  getByStock,
  getDailyActivity,
  getOpenPositions,
  getOverview,
  getStatusBreakdown,
  getStockStats,
  type StatsFilters,
  type StockStatsFilters,
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

export function useOpenPositions(ticker?: string) {
  return useQuery({
    queryKey: ['stats', 'open-positions', ticker],
    queryFn: () => getOpenPositions(ticker),
    refetchInterval: 30_000,
  })
}

export function useStockStats(ticker: string, filters: StockStatsFilters = {}) {
  return useQuery({
    queryKey: ['stats', 'stock', ticker, filters],
    queryFn: () => getStockStats(ticker, filters),
  })
}
