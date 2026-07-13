import { useMutation, useQueryClient } from '@tanstack/react-query'
import { sendTestSignal } from '@/api/testSignal'

export function useSendTestSignal() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: sendTestSignal,
    onSuccess: () => {
      // The real webhook path relies on 'trade:created'/'positions:updated'
      // socket events to refresh these; invalidate explicitly here too so
      // the result is visible immediately regardless of socket timing.
      queryClient.invalidateQueries({ queryKey: ['trades'] })
      queryClient.invalidateQueries({ queryKey: ['stats'] })
      queryClient.invalidateQueries({ queryKey: ['system', 'status'] })
    },
  })
}
