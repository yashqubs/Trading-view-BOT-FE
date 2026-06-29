import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ErrorBoundary } from './ErrorBoundary'

function Throws(): never {
  throw new RangeError('Data too long')
}

describe('ErrorBoundary', () => {
  it('renders the fallback instead of crashing when a child throws during render', () => {
    render(
      <ErrorBoundary fallback={<p>Fallback rendered</p>}>
        <Throws />
      </ErrorBoundary>,
    )

    expect(screen.getByText('Fallback rendered')).toBeInTheDocument()
  })

  it('renders children normally when nothing throws', () => {
    render(
      <ErrorBoundary fallback={<p>Fallback rendered</p>}>
        <p>All good</p>
      </ErrorBoundary>,
    )

    expect(screen.getByText('All good')).toBeInTheDocument()
  })
})
