import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createStock,
  deleteStock,
  getStock,
  listStockTickers,
  listStocks,
  searchIgMarkets,
  updateStock,
  type CreateStockInput,
  type StockFilters,
  type StockListResponse,
  type UpdateStockInput,
} from '@/api/mapping'

export function useStocks(filters: StockFilters) {
  return useQuery<StockListResponse>({
    queryKey: ['stocks', filters],
    queryFn: () => listStocks(filters),
    placeholderData: keepPreviousData,
  })
}

export function useStockTickers() {
  return useQuery({
    queryKey: ['stocks', 'tickers'],
    queryFn: listStockTickers,
  })
}

export function useStock(ticker: string) {
  return useQuery({
    queryKey: ['stocks', ticker],
    queryFn: () => getStock(ticker),
    enabled: !!ticker,
  })
}

export function useIgMarketSearch(term: string) {
  return useQuery({
    queryKey: ['ig-market-search', term],
    queryFn: () => searchIgMarkets(term),
    enabled: term.trim().length > 1,
  })
}

export function useCreateStock() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateStockInput) => createStock(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stocks'] })
    },
  })
}

export function useUpdateStock() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: UpdateStockInput }) => updateStock(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stocks'] })
    },
  })
}

export function useDeleteStock() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteStock(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stocks'] })
    },
  })
}
