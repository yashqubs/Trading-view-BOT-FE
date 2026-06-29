import { useState } from 'react'
import { Check, ChevronsUpDown, LayoutGrid } from 'lucide-react'
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
import { cn } from '@/lib/utils'

interface StockComboboxProps {
  tickers: string[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function StockCombobox({
  tickers,
  value,
  onChange,
  placeholder = 'All stocks',
}: StockComboboxProps) {
  const [open, setOpen] = useState(false)

  const displayLabel = value || placeholder

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="secondary"
          role="combobox"
          aria-expanded={open}
          className="h-8 w-[160px] justify-between gap-1 px-3 text-xs font-normal"
        >
          {value ? (
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              {displayLabel}
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-text-tertiary">
              <LayoutGrid className="h-3.5 w-3.5" />
              {displayLabel}
            </span>
          )}
          <ChevronsUpDown className="ml-auto h-3.5 w-3.5 shrink-0 text-text-tertiary" />
        </Button>
      </PopoverTrigger>

      <PopoverContent align="start" className="w-[200px] p-0">
        <Command>
          <CommandInput placeholder="Search ticker…" />
          <CommandList>
            <CommandEmpty>No stock found.</CommandEmpty>
            <CommandGroup>
              {/* All stocks option */}
              <CommandItem
                value=""
                onSelect={() => {
                  onChange('')
                  setOpen(false)
                }}
              >
                <Check className={cn('h-3.5 w-3.5', value === '' ? 'opacity-100 text-accent' : 'opacity-0')} />
                <span>All stocks</span>
              </CommandItem>

              {tickers.map((ticker) => (
                <CommandItem
                  key={ticker}
                  value={ticker}
                  onSelect={(selected) => {
                    onChange(selected === value ? '' : selected)
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      'h-3.5 w-3.5',
                      value === ticker ? 'opacity-100 text-accent' : 'opacity-0',
                    )}
                  />
                  {ticker}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
