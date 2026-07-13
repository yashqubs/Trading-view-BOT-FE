import { api } from './axios'

export interface SystemStatus {
  webhookUrl: string
  igConnected: boolean
  igSessionExpiresAt: string | null
  lastSignalReceivedAt: string | null
  /** Whether POST /signal/test is usable — dev-only manual signal tool. */
  testSignalsEnabled: boolean
}

export function getSystemStatus() {
  return api.get<SystemStatus>('/system/status').then((r) => r.data)
}
