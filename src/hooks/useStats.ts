import { useQuery } from '@tanstack/react-query'
import { getByStock, getDailyActivity, getOverview, getStatusBreakdown, getStockStats } from '@/api/stats'

export function useOverview() {
  return useQuery({ queryKey: ['stats', 'overview'], queryFn: getOverview, refetchInterval: 30_000 })
}

export function useDailyActivity(days = 30) {
  return useQuery({ queryKey: ['stats', 'daily-activity', days], queryFn: () => getDailyActivity(days) })
}

export function useByStock() {
  return useQuery({ queryKey: ['stats', 'by-stock'], queryFn: getByStock })
}

export function useStatusBreakdown() {
  return useQuery({ queryKey: ['stats', 'status-breakdown'], queryFn: getStatusBreakdown })
}

export function useStockStats(ticker: string) {
  return useQuery({ queryKey: ['stats', 'stock', ticker], queryFn: () => getStockStats(ticker) })
}
