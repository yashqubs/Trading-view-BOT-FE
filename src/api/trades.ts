import { api } from './axios'
import type { TradeDirection, TradeLog, TradeStatus } from '@/types'

export interface TradeFilters {
  ticker?: string
  direction?: TradeDirection
  status?: TradeStatus
  from?: string
  to?: string
  page?: number
  pageSize?: number
}

export interface TradeListResponse {
  items: TradeLog[]
  total: number
}

export function listTrades(filters: TradeFilters = {}) {
  return api.get<TradeListResponse>('/trades', { params: filters }).then((r) => r.data)
}

export function exportTradesCsv(filters: TradeFilters = {}) {
  return api
    .get<Blob>('/trades/export', { params: filters, responseType: 'blob' })
    .then((r) => r.data)
}
