import { api } from './axios'
import type { TradeDirection, TradeLog } from '@/types'

export interface SendTestSignalInput {
  tvTicker: string
  direction: TradeDirection
  price: number
}

/** Dev-only — runs the real condition pipeline immediately and returns the resulting trade_log row. */
export function sendTestSignal(input: SendTestSignalInput) {
  return api.post<TradeLog>('/signal/test', input).then((r) => r.data)
}
