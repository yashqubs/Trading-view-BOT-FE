import type { TradeDirection } from '@/types'

/**
 * trade_log.error_message holds IG's raw rejection code (or our backend's) —
 * meaningful for debugging, cryptic on screen. Returns a plain-English
 * explanation for the codes we've actually seen, or null for anything
 * unrecognised (callers then show the raw message as-is, so new codes are
 * never hidden).
 */
export function explainTradeError(error: string, direction?: TradeDirection): string | null {
  switch (error) {
    case 'LIMIT_ORDER_WRONG_SIDE_OF_MARKET':
      return direction === 'SELL'
        ? 'The market is trading below your minimum acceptable price (signal price minus slippage), so the order was rejected rather than selling too low.'
        : 'The market is trading above your maximum acceptable price (signal price plus slippage), so the order was rejected rather than overpaying.'
    case 'INSUFFICIENT_FUNDS':
      return 'The IG account does not have enough funds for this trade.'
    case 'MARKET_CLOSED':
    case 'MARKET_OFFLINE':
    case 'MARKET_CLOSED_WITH_EDITS':
      return 'This market is currently closed on IG.'
    case 'NO_LIVE_QUOTE':
      return 'IG has no live price for this market right now, so the order could not be placed safely.'
    case 'NO_POSITION_AT_EXECUTION':
      return 'There was no open position left to close by the time the order was placed.'
    case 'ATTACHED_ORDER_LEVEL_ERROR':
      return 'IG rejected the order price level as invalid for this market.'
    case 'MARKET_NOT_BORROWABLE':
      return 'This market cannot be shorted on IG right now — opening a short position (a SELL with no existing position to close) is not available for this instrument.'
    case 'CLOSING_ONLY_TRADES_ACCEPTED_ON_THIS_MARKET':
      return 'IG has put this market into closing-only mode, so existing positions can be closed but no new position can be opened.'
    case 'error.confirms.deal-not-found':
      return 'IG rejected this order at the gateway before it created a confirmable deal, so IG never returned a specific reason. We checked IG’s live positions and confirmed nothing was opened, so this genuinely did not fill. A common cause is the stock being unborrowable for shorting — check IG’s own account activity history for the exact reason.'
    default:
      return null
  }
}

/**
 * Fallback for codes explainTradeError doesn't recognise: IG sends them as one
 * unbroken SCREAMING_SNAKE token, which reads badly and can't wrap. Turn it
 * into spaced sentence case so it stays readable (and wrappable) on screen —
 * anything that isn't a bare code (a real sentence, a dotted key) is left
 * untouched. The raw code is still shown alongside it in the detail modal.
 */
export function humanizeTradeError(error: string): string {
  if (!/^[A-Z0-9]+(?:_[A-Z0-9]+)+$/.test(error)) return error
  const sentence = error.toLowerCase().replace(/_/g, ' ')
  return sentence.charAt(0).toUpperCase() + sentence.slice(1)
}
