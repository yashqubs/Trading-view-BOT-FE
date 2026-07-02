import { useQuery, useQueryClient } from '@tanstack/react-query'
import { listTrades, type TradeFilters } from '@/api/trades'
import { useSocketEvent } from './useSocketEvent'

export function useTrades(filters: TradeFilters) {
  const queryClient = useQueryClient()
  // Previously this view had no live-refresh at all — a trade firing while
  // someone was looking at this page was invisible until a manual reload.
  useSocketEvent('trade:created', () => queryClient.invalidateQueries({ queryKey: ['trades'] }))

  return useQuery({
    queryKey: ['trades', filters],
    queryFn: () => listTrades(filters),
    placeholderData: (previous) => previous,
  })
}
