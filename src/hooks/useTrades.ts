import { useQuery } from '@tanstack/react-query'
import { listTrades, type TradeFilters } from '@/api/trades'

export function useTrades(filters: TradeFilters) {
  return useQuery({
    queryKey: ['trades', filters],
    queryFn: () => listTrades(filters),
    placeholderData: (previous) => previous,
  })
}
