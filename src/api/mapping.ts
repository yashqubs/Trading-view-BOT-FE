import { api } from './axios'
import type { IgMarketResult, StockMapping } from '@/types'

export function listStocks() {
  return api.get<StockMapping[]>('/mapping').then((r) => r.data)
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
  investmentAmount: number
  maxDailySpend?: number | null
  coolDownMinutes?: number | null
  maxOpenPositions?: number
}

export function createStock(input: CreateStockInput) {
  return api.post<StockMapping>('/mapping', input).then((r) => r.data)
}

export type UpdateStockInput = Partial<
  Omit<CreateStockInput, 'tvTicker' | 'igEpic' | 'instrumentName' | 'instrumentType'>
> & { enabled?: boolean }

export function updateStock(id: number, input: UpdateStockInput) {
  return api.patch<StockMapping>(`/mapping/${id}`, input).then((r) => r.data)
}

export function deleteStock(id: number) {
  return api.delete(`/mapping/${id}`).then((r) => r.data)
}
