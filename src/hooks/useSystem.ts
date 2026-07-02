import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getSystemStatus } from '@/api/system'
import { useSocketEvent } from './useSocketEvent'

export function useSystemStatus() {
  const queryClient = useQueryClient()
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['system', 'status'] })

  useSocketEvent('system:status', invalidate)
  // Every webhook delivery (trade or skip) touches lastSignalReceivedAt, so
  // the "last signal" readout stays live the same way the rest of the
  // system status card does.
  useSocketEvent('trade:created', invalidate)

  return useQuery({ queryKey: ['system', 'status'], queryFn: getSystemStatus })
}
