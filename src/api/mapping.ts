import { api } from './axios'
import type { ExecutionMode, IgMarketResult, StockMapping } from '@/types'

export type StockSortBy = 'tvTicker' | 'investmentAmount' | 'maxDailySpend' | 'createdAt'

export interface StockFilters {
  search?: string
  enabled?: boolean
  sortBy?: StockSortBy
  sortOrder?: 'asc' | 'desc'
  page?: number
  pageSize?: number
}

export interface StockListResponse {
  items: StockMapping[]
  total: number
}

export function listStocks(filters: StockFilters = {}) {
  return api.get<StockListResponse>('/mapping', { params: filters }).then((r) => r.data)
}

export function listStockTickers() {
  return api.get<string[]>('/mapping/tickers').then((r) => r.data)
}

export function getStock(ticker: string) {
  return api.get<StockMapping>(`/mapping/${ticker}`).then((r) => r.data)
}

export function searchIgMarkets(term: string) {
  return api.get<IgMarketResult[]>('/mapping/search', { params: { term } }).then((r) => r.data)
}

export interface CreateStockInput {
  tvTicker: string
  igEpic: string
  instrumentName: string
  instrumentType: string
  /** Omit to inherit the global default (TradingRules.investmentAmount). */
  investmentAmount?: number
  maxDailySpend?: number | null
  /** Omit to inherit the global default (TradingRules.executionMode). */
  executionMode?: ExecutionMode
  /** Omit to inherit the global default (TradingRules.maxSlippagePercent). Independent of executionMode. */
  maxSlippagePercent?: number
}

export function createStock(input: CreateStockInput) {
  return api.post<StockMapping>('/mapping', input).then((r) => r.data)
}

export type UpdateStockInput = Partial<
  Omit<CreateStockInput, 'investmentAmount' | 'executionMode' | 'maxSlippagePercent'>
> & {
  enabled?: boolean
  /** Send null explicitly to revert back to inheriting the global default. */
  investmentAmount?: number | null
  executionMode?: ExecutionMode | null
  maxSlippagePercent?: number | null
}

export function updateStock(id: number, input: UpdateStockInput) {
  return api.patch<StockMapping>(`/mapping/${id}`, input).then((r) => r.data)
}

export function deleteStock(id: number) {
  return api.delete(`/mapping/${id}`).then((r) => r.data)
}
