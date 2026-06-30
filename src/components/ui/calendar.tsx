import { useState } from 'react'
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { DayPicker, type DayPickerProps, type DayButtonProps, type DropdownProps } from 'react-day-picker'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

export type CalendarProps = DayPickerProps

/**
 * react-day-picker's default dropdown renders a real native `<select>`
 * (invisible, overlaid on the visible label) so clicking opens the OS
 * picker — but a native select's option-list popup is drawn by the OS/
 * browser chrome, not by us, so it can never be themed (that's the
 * unstyled white list bug). Swap in a fully custom popover instead.
 */
function CalendarDropdown({ options, value, onChange, disabled }: DropdownProps) {
  const [open, setOpen] = useState(false)
  const selected = options?.find((o) => o.value === value)

  function selectOption(v: number) {
    onChange?.({ target: { value: String(v) } } as React.ChangeEvent<HTMLSelectElement>)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            'flex cursor-pointer select-none items-center gap-0.5 rounded-md px-1 py-0.5',
            'text-[13px] font-semibold text-text-primary transition-colors',
            'hover:bg-accent/15 hover:text-accent',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
            'disabled:pointer-events-none disabled:opacity-40',
          )}
        >
          {selected?.label}
          <ChevronDown className="h-3 w-3 opacity-60" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" sideOffset={4} className="max-h-60 w-32 overflow-y-auto p-1">
        {options?.map((option) => (
          <button
            key={option.value}
            type="button"
            disabled={option.disabled}
            onClick={() => selectOption(option.value)}
            className={cn(
              'block w-full rounded-md px-2 py-1.5 text-left text-sm transition-colors',
              option.value === value
                ? 'bg-accent text-accent-foreground font-medium'
                : 'text-text-primary hover:bg-surface',
              option.disabled && 'pointer-events-none opacity-30',
            )}
          >
            {option.label}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  )
}

// Endpoint days (start/end of a range, or a lone selected day) get a solid
// filled circle. Middle-of-range days get a flat muted band, no circle —
// computed explicitly here instead of via CSS cascade, since the
// "selected" and "range_middle" modifiers are both active simultaneously
// on middle days and fighting over the same button via Tailwind classes
// is unreliable.
function DayButton({ day: _day, modifiers, className, ...props }: DayButtonProps) {
  const isEndpoint = modifiers.range_start || modifiers.range_end || (modifiers.selected && !modifiers.range_middle)
  // hoverPreview: a custom matcher passed in by consumers to show a live
  // "what would this range look like" band while the user is still picking
  // the end date — purely visual, never affects the real selection state.
  const isHoverPreview = !!modifiers.hoverPreview && !modifiers.selected

  return (
    <button
      {...props}
      className={cn(
        'inline-flex h-9 w-9 items-center justify-center text-sm transition-colors duration-100',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
        'aria-disabled:pointer-events-none aria-disabled:opacity-30',
        modifiers.range_middle
          ? 'rounded-none font-normal text-text-primary hover:bg-accent/30'
          : isEndpoint
            ? cn(
                'rounded-full font-semibold bg-accent text-accent-foreground',
                'shadow-[0_0_0_2px_var(--surface),0_0_0_3.5px_var(--accent)]',
              )
            : cn(
                'rounded-full font-normal text-text-primary hover:bg-accent/20',
                isHoverPreview && 'bg-accent/15 rounded-none',
                modifiers.today && 'ring-2 ring-inset ring-accent text-accent font-semibold',
              ),
        className,
      )}
    />
  )
}

export function Calendar({
  className,
  classNames: externalClassNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      navLayout="around"
      className={cn('select-none p-4', className)}
      classNames={{
        // ── Containers ────────────────────────────────────────────────────
        months: 'flex flex-col items-center gap-6 sm:flex-row sm:justify-center',

        // relative so absolute arrow buttons are positioned inside it
        month: 'relative space-y-3',

        // px-9 keeps text clear of the arrow buttons (buttons are w-9)
        month_caption: 'flex h-9 items-center justify-center px-9',

        // Only used when captionLayout isn't 'dropdown' — the dropdown case
        // renders its own label via the custom CalendarDropdown component.
        caption_label: cn(
          'flex cursor-pointer select-none items-center gap-0.5',
          'text-[13px] font-semibold text-text-primary',
          'transition-colors hover:text-accent',
        ),

        // nav is unused with navLayout="around" — keep empty
        nav: '',

        // Prev/next arrow buttons — absolutely inside the month block
        button_previous: cn(
          'absolute left-0 top-0',
          'inline-flex h-9 w-9 items-center justify-center rounded-lg',
          'text-text-tertiary transition-colors duration-150',
          'hover:bg-accent/15 hover:text-accent',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
          'disabled:pointer-events-none disabled:opacity-30',
        ),
        button_next: cn(
          'absolute right-0 top-0',
          'inline-flex h-9 w-9 items-center justify-center rounded-lg',
          'text-text-tertiary transition-colors duration-150',
          'hover:bg-accent/15 hover:text-accent',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
          'disabled:pointer-events-none disabled:opacity-30',
        ),

        // ── Dropdown caption (month + year, rendered by CalendarDropdown) ──
        dropdowns: 'flex items-center gap-1',

        // ── Grid ─────────────────────────────────────────────────────────
        month_grid: 'w-full border-collapse',
        weekdays:   'flex',
        weekday:    'w-9 pb-1.5 text-center text-[10px] font-semibold uppercase tracking-widest text-text-tertiary',
        week:       'mt-0.5 flex',

        // ── Day cell <td> ─────────────────────────────────────────────────
        day: 'relative h-9 w-9 p-0 text-center',

        // ── Range band on <td> ────────────────────────────────────────────
        range_start:  'bg-accent/15 rounded-l-full',
        range_end:    'bg-accent/15 rounded-r-full',
        range_middle: 'bg-accent/15',

        outside:  'opacity-40',
        disabled: 'opacity-30 pointer-events-none',
        hidden:   'invisible',

        ...externalClassNames,
      }}

      components={{
        Chevron: ({ orientation }) => {
          if (orientation === 'left')  return <ChevronLeft  className="h-4 w-4" />
          if (orientation === 'right') return <ChevronRight className="h-4 w-4" />
          return <ChevronDown className="h-3 w-3 opacity-60" />
        },
        DayButton: DayButton,
        Dropdown: CalendarDropdown,
      }}

      {...props}
    />
  )
}
