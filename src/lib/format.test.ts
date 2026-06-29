import { describe, expect, it } from 'vitest'
import { formatCount, formatMoney, formatPercent } from './format'

describe('formatMoney', () => {
  it('formats to 2 decimal places with currency symbol', () => {
    expect(formatMoney(1234.5)).toBe('£1,234.50')
  })

  it('returns an em dash for nullish input', () => {
    expect(formatMoney(null)).toBe('—')
  })
})

describe('formatPercent', () => {
  it('formats to 1 decimal place', () => {
    expect(formatPercent(87.654)).toBe('87.7%')
  })
})

describe('formatCount', () => {
  it('rounds to the nearest integer', () => {
    expect(formatCount(12.6)).toBe('13')
  })
})
