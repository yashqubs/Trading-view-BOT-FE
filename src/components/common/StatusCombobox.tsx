import { useState } from 'react'
import { Check, ChevronsUpDown, ListFilter } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { StatusPill } from '@/components/common/StatusPill'
import { cn } from '@/lib/utils'
import type { TradeStatus } from '@/types'

// Grouped so ~19 statuses are scannable without endless scrolling — mirrors
// the distinctions already documented in the backend (signal pipeline steps,
// vs. account/config gates, vs. legacy-only statuses nothing writes anymore
// but historical rows still carry).
const STATUS_GROUPS: { heading: string; statuses: TradeStatus[] }[] = [
  { heading: 'Outcome', statuses: ['SUCCESS', 'FAILED'] },
  { heading: 'Position state', statuses: ['ALREADY_LONG', 'ALREADY_SHORT'] },
  {
    heading: 'Risk limits',
    statuses: ['DAILY_TOTAL_LIMIT', 'DAILY_TRADE_LIMIT', 'STOCK_DAILY_LIMIT'],
  },
  {
    heading: 'Configuration',
    statuses: ['BOT_PAUSED', 'AUTO_PAUSED', 'BUY_DISABLED', 'SELL_DISABLED', 'DISABLED', 'NOT_MAPPED'],
  },
  { heading: 'Technical', statuses: ['DUPLICATE_SIGNAL'] },
  {
    heading: 'Legacy (historical rows only)',
    statuses: ['MARKET_CLOSED', 'NO_POSITION', 'GLOBAL_POSITION_LIMIT', 'COOL_DOWN', 'MAX_POSITIONS_STOCK'],
  },
]

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

interface StatusComboboxProps {
  value: TradeStatus | 'ALL'
  onChange: (value: TradeStatus | 'ALL') => void
}

export function StatusCombobox({ value, onChange }: StatusComboboxProps) {
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="secondary"
          role="combobox"
          aria-expanded={open}
          className="h-10 w-full justify-between gap-1 px-3 text-sm font-normal"
        >
          {value === 'ALL' ? (
            <span className="flex items-center gap-1.5 text-text-tertiary">
              <ListFilter className="h-3.5 w-3.5" />
              All statuses
            </span>
          ) : (
            <StatusPill status={value} />
          )}
          <ChevronsUpDown className="ml-auto h-3.5 w-3.5 shrink-0 text-text-tertiary" />
        </Button>
      </PopoverTrigger>

      <PopoverContent align="start" className="w-[260px] p-0">
        <Command
          filter={(itemValue, search) => {
            const label = STATUS_LABEL[itemValue as TradeStatus] ?? itemValue
            return label.toLowerCase().includes(search.toLowerCase()) ? 1 : 0
          }}
        >
          <CommandInput placeholder="Search statuses…" />
          <CommandList>
            <CommandEmpty>No status found.</CommandEmpty>
            <CommandGroup>
              <CommandItem
                value="ALL"
                onSelect={() => {
                  onChange('ALL')
                  setOpen(false)
                }}
              >
                <Check className={cn('h-3.5 w-3.5', value === 'ALL' ? 'opacity-100 text-accent' : 'opacity-0')} />
                All statuses
              </CommandItem>
            </CommandGroup>

            {STATUS_GROUPS.map((group) => (
              <CommandGroup key={group.heading} heading={group.heading}>
                {group.statuses.map((status) => (
                  <CommandItem
                    key={status}
                    value={status}
                    onSelect={(selected) => {
                      onChange(selected === value ? 'ALL' : (selected as TradeStatus))
                      setOpen(false)
                    }}
                  >
                    <Check
                      className={cn('h-3.5 w-3.5', value === status ? 'opacity-100 text-accent' : 'opacity-0')}
                    />
                    <StatusPill status={status} />
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
