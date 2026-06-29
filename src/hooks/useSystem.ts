import { useQuery } from '@tanstack/react-query'
import { getSystemStatus } from '@/api/system'

export function useSystemStatus() {
  return useQuery({ queryKey: ['system', 'status'], queryFn: getSystemStatus, refetchInterval: 60_000 })
}
