import { api } from './axios'
import type { TradingRules } from '@/types'

export function getTradingRules() {
  return api.get<TradingRules>('/rules').then((r) => r.data)
}

export type UpdateTradingRulesInput = Partial<
  Omit<TradingRules, 'id' | 'consecutiveFailureCount' | 'updatedAt' | 'updatedBy'>
>

export function updateTradingRules(input: UpdateTradingRulesInput) {
  return api.patch<TradingRules>('/rules', input).then((r) => r.data)
}

export function setBotEnabled(enabled: boolean) {
  return api.patch<TradingRules>('/rules', { botEnabled: enabled }).then((r) => r.data)
}
