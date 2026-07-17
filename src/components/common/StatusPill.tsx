import { Badge, type BadgeProps } from '@/components/ui/badge'
import type { TradeStatus } from '@/types'

const STATUS_VARIANT: Record<TradeStatus, BadgeProps['variant']> = {
  SUCCESS: 'success',
  FAILED: 'danger',
  BOT_PAUSED: 'danger',
  AUTO_PAUSED: 'danger',
  NOT_MAPPED: 'warning',
  NO_POSITION: 'warning',
  ALREADY_LONG: 'neutral',
  ALREADY_SHORT: 'neutral',
  DAILY_TOTAL_LIMIT: 'warning',
  DAILY_TRADE_LIMIT: 'warning',
  GLOBAL_POSITION_LIMIT: 'warning',
  STOCK_DAILY_LIMIT: 'warning',
  MAX_POSITIONS_STOCK: 'warning',
  MARKET_CLOSED: 'neutral',
  DISABLED: 'neutral',
  BUY_DISABLED: 'neutral',
  SELL_DISABLED: 'neutral',
  COOL_DOWN: 'neutral',
  DUPLICATE_SIGNAL: 'neutral',
}

const STATUS_LABEL: Record<TradeStatus, string> = {
  SUCCESS: 'Success',
  FAILED: 'Failed',
  MARKET_CLOSED: 'Market closed',
  NOT_MAPPED: 'Not mapped',
  DISABLED: 'Disabled',
  NO_POSITION: 'No position',
  ALREADY_LONG: 'Already long',
  ALREADY_SHORT: 'Already short',
  BOT_PAUSED: 'Bot paused',
  BUY_DISABLED: 'Buy disabled',
  SELL_DISABLED: 'Sell disabled',
  DAILY_TOTAL_LIMIT: 'Daily open cap reached',
  DAILY_TRADE_LIMIT: 'Daily trade limit',
  GLOBAL_POSITION_LIMIT: 'Global position limit',
  STOCK_DAILY_LIMIT: 'Stock daily limit',
  COOL_DOWN: 'Cool-down',
  MAX_POSITIONS_STOCK: 'Max positions reached',
  AUTO_PAUSED: 'Auto-paused',
  DUPLICATE_SIGNAL: 'Duplicate signal',
}

export function StatusPill({ status, className }: { status: TradeStatus; className?: string }) {
  return <Badge variant={STATUS_VARIANT[status]} className={className}>{STATUS_LABEL[status]}</Badge>
}
