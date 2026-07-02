import { useQuery, useQueryClient } from '@tanstack/react-query'
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
import { useSocketEvent } from './useSocketEvent'

export function useOverview(filters: StatsFilters = {}) {
  const queryClient = useQueryClient()
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['stats', 'overview'] })
  // A trade executing or the bot/rules changing are the only things that can
  // change these numbers — no fixed-interval refetch needed.
  useSocketEvent('trade:created', invalidate)
  useSocketEvent('rules:updated', invalidate)

  return useQuery({
    queryKey: ['stats', 'overview', filters],
    queryFn: () => getOverview(filters),
  })
}

export function useDailyActivity(filters: StatsFilters = {}) {
  const queryClient = useQueryClient()
  useSocketEvent('trade:created', () =>
    queryClient.invalidateQueries({ queryKey: ['stats', 'daily-activity'] }),
  )

  return useQuery({
    queryKey: ['stats', 'daily-activity', filters],
    queryFn: () => getDailyActivity(filters),
  })
}

export function useByStock(filters: StatsFilters = {}) {
  const queryClient = useQueryClient()
  useSocketEvent('trade:created', () =>
    queryClient.invalidateQueries({ queryKey: ['stats', 'by-stock'] }),
  )

  return useQuery({
    queryKey: ['stats', 'by-stock', filters],
    queryFn: () => getByStock(filters),
  })
}

export function useStatusBreakdown(filters: StatsFilters = {}) {
  const queryClient = useQueryClient()
  useSocketEvent('trade:created', () =>
    queryClient.invalidateQueries({ queryKey: ['stats', 'status-breakdown'] }),
  )

  return useQuery({
    queryKey: ['stats', 'status-breakdown', filters],
    queryFn: () => getStatusBreakdown(filters),
  })
}

export function useOpenPositions(ticker?: string) {
  const queryClient = useQueryClient()
  useSocketEvent('positions:updated', () =>
    queryClient.invalidateQueries({ queryKey: ['stats', 'open-positions'] }),
  )

  return useQuery({
    queryKey: ['stats', 'open-positions', ticker],
    queryFn: () => getOpenPositions(ticker),
  })
}

export function useStockStats(ticker: string, filters: StockStatsFilters = {}) {
  return useQuery({
    queryKey: ['stats', 'stock', ticker, filters],
    queryFn: () => getStockStats(ticker, filters),
  })
}
