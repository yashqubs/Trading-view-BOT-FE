import { api } from './axios'
import type { Market } from '@/types'

export function listMarkets() {
  return api.get<Market[]>('/markets').then((r) => r.data)
}

export function getMarket(id: number) {
  return api.get<Market>(`/markets/${id}`).then((r) => r.data)
}

export interface CreateMarketInput {
  name: string
  timezone: string
  openTime: string
  closeTime: string
  weekdaysOnly?: boolean
}

export function createMarket(input: CreateMarketInput) {
  return api.post<Market>('/markets', input).then((r) => r.data)
}

export type UpdateMarketInput = Partial<CreateMarketInput>

export function updateMarket(id: number, input: UpdateMarketInput) {
  return api.patch<Market>(`/markets/${id}`, input).then((r) => r.data)
}

export function deleteMarket(id: number) {
  return api.delete(`/markets/${id}`).then((r) => r.data)
}
