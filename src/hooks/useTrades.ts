import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query'
import { listTrades, type TradeFilters, type TradeListResponse } from '@/api/trades'
import { useSocketEvent } from './useSocketEvent'

export function useTrades(filters: TradeFilters) {
  const queryClient = useQueryClient()
  // Previously this view had no live-refresh at all — a trade firing while
  // someone's looking at this page was invisible until a manual reload.
  useSocketEvent('trade:created', () => queryClient.invalidateQueries({ queryKey: ['trades'] }))

  return useQuery<TradeListResponse>({
    queryKey: ['trades', filters],
    queryFn: () => listTrades(filters),
    placeholderData: keepPreviousData,
  })
}
