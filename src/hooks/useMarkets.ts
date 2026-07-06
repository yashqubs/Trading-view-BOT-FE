import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createMarket,
  deleteMarket,
  getMarket,
  listMarkets,
  updateMarket,
  type CreateMarketInput,
  type UpdateMarketInput,
} from '@/api/markets'

export function useMarkets() {
  return useQuery({ queryKey: ['markets'], queryFn: listMarkets })
}

export function useMarket(id: number) {
  return useQuery({
    queryKey: ['markets', id],
    queryFn: () => getMarket(id),
    enabled: !!id,
  })
}

export function useCreateMarket() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateMarketInput) => createMarket(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['markets'] }),
  })
}

export function useUpdateMarket() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: UpdateMarketInput }) => updateMarket(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['markets'] })
      // A stock's displayed market name/hours would otherwise go stale.
      queryClient.invalidateQueries({ queryKey: ['stocks'] })
    },
  })
}

export function useDeleteMarket() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteMarket(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['markets'] }),
  })
}
