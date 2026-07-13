export function formatMoney(value: number | null | undefined, currency = 'GBP') {
  if (value === null || value === undefined || Number.isNaN(value)) return '—'
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

export function formatPercent(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) return '—'
  return `${value.toFixed(1)}%`
}

export function formatCount(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) return '—'
  return new Intl.NumberFormat('en-GB', { maximumFractionDigits: 0 }).format(Math.round(value))
}

export function formatDate(value: string | Date | null | undefined) {
  if (!value) return '—'
  const date = typeof value === 'string' ? new Date(value) : value
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

export function formatDateTime(value: string | Date | null | undefined) {
  if (!value) return '—'
  const date = typeof value === 'string' ? new Date(value) : value
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date)
}

export function formatPrice(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) return '—'
  return value.toFixed(2)
}

export function formatQuantity(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) return '—'
  return value.toFixed(4).replace(/0+$/, '').replace(/\.$/, '')
}

export function formatRelativeTime(value: string | Date | null | undefined) {
  if (!value) return null
  const date = typeof value === 'string' ? new Date(value) : value
  if (Number.isNaN(date.getTime())) return null

  const diffSeconds = Math.round((date.getTime() - Date.now()) / 1000)
  const absSeconds = Math.abs(diffSeconds)
  const rtf = new Intl.RelativeTimeFormat('en-GB', { numeric: 'auto' })

  if (absSeconds < 60) return rtf.format(diffSeconds, 'second')
  if (absSeconds < 3600) return rtf.format(Math.round(diffSeconds / 60), 'minute')
  if (absSeconds < 86400) return rtf.format(Math.round(diffSeconds / 3600), 'hour')
  if (absSeconds < 604800) return rtf.format(Math.round(diffSeconds / 86400), 'day')
  return rtf.format(Math.round(diffSeconds / 604800), 'week')
}
