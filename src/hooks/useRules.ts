import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getTradingRules, setBotEnabled, updateTradingRules, type UpdateTradingRulesInput } from '@/api/rules'

export function useTradingRules() {
  return useQuery({ queryKey: ['rules'], queryFn: getTradingRules })
}

export function useUpdateTradingRules() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: UpdateTradingRulesInput) => updateTradingRules(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rules'] })
      queryClient.invalidateQueries({ queryKey: ['stats', 'overview'] })
    },
  })
}

export function useSetBotEnabled() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (enabled: boolean) => setBotEnabled(enabled),
    onMutate: async (enabled) => {
      await queryClient.cancelQueries({ queryKey: ['rules'] })
      const previous = queryClient.getQueryData(['rules'])
      queryClient.setQueryData(['rules'], (old: unknown) =>
        old ? { ...(old as object), botEnabled: enabled } : old,
      )
      return { previous }
    },
    onError: (_err, _enabled, context) => {
      if (context?.previous) queryClient.setQueryData(['rules'], context.previous)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['rules'] })
      queryClient.invalidateQueries({ queryKey: ['stats', 'overview'] })
    },
  })
}
