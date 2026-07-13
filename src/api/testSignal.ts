import { api } from './axios'
import type { ExecutionMode, TradeDirection, TradeLog } from '@/types'

export interface SendTestSignalInput {
  tvTicker: string
  direction: TradeDirection
  price: number
  /** Omit to use the stock's configured amount (its own override, or the global default). */
  investmentAmount?: number
  /** Omit to use the stock's configured fill price (its own override, or the global default). */
  executionMode?: ExecutionMode
  /** Omit to use the stock's configured tolerance (its own override, or the global default). */
  maxSlippagePercent?: number
}

/** Dev-only — runs the real condition pipeline immediately and returns the resulting trade_log row. */
export function sendTestSignal(input: SendTestSignalInput) {
  return api.post<TradeLog>('/signal/test', input).then((r) => r.data)
}
