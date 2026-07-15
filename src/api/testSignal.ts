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

/** One raw HTTP exchange with IG, captured only for this one test signal.
 * Never includes headers (no CST/X-SECURITY-TOKEN/API key). */
export interface IgDebugEntry {
  method: string
  url: string
  version: number
  requestBody: unknown
  responseBody?: unknown
  errorCode?: string
  durationMs: number
  timestamp: string
}

export interface TestSignalResult extends TradeLog {
  /** Empty if the signal never reached IG (e.g. skipped by an earlier condition). */
  igDebug: IgDebugEntry[]
}

/** Dev-only — runs the real condition pipeline immediately and returns the resulting trade_log row,
 * plus the raw IG request/response for this one signal. */
export function sendTestSignal(input: SendTestSignalInput) {
  return api.post<TestSignalResult>('/signal/test', input).then((r) => r.data)
}
