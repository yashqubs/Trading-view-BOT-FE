import type { ReactNode } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface ChartExpandModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  /** Filter controls (date range, ticker, etc.) shown above the enlarged chart. */
  filters?: ReactNode
  children: ReactNode
}

/**
 * Full-size overlay for a single chart — bigger canvas plus its own filter
 * controls, reusing whatever filter state/hook the calling page already
 * owns so adjustments here stay in sync with the page behind it.
 */
export function ChartExpandModal({ open, onOpenChange, title, filters, children }: ChartExpandModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {filters && <div className="mb-4 flex flex-wrap items-center gap-3">{filters}</div>}
        {children}
      </DialogContent>
    </Dialog>
  )
}
