import { api } from './axios'

export interface SystemStatus {
  webhookUrl: string
  igConnected: boolean
  igSessionExpiresAt: string | null
}

export function getSystemStatus() {
  return api.get<SystemStatus>('/system/status').then((r) => r.data)
}
