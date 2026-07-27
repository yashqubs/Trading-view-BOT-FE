import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  closeAllPositions,
  listTrades,
  type CloseAllPositionsResult,
  type TradeFilters,
  type TradeListResponse,
} from '@/api/trades'
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

/**
 * Every attempt writes a trade_log row and the dashboard's open-position count
 * moves, so refetch both regardless of the outcome — even an all-failed run
 * changed the history, and a partial success changed the positions.
 */
export function useCloseAllPositions() {
  const queryClient = useQueryClient()
  return useMutation<CloseAllPositionsResult>({
    mutationFn: closeAllPositions,
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['stats'] })
      queryClient.invalidateQueries({ queryKey: ['trades'] })
    },
  })
}
