import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { DayPicker, type DayPickerProps, type DayButtonProps } from 'react-day-picker'
import { cn } from '@/lib/utils'

export type CalendarProps = DayPickerProps

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

/*
 * Dropdown caption layout (captionLayout="dropdown"):
 *
 *   <span dropdown_root>        ← `dropdown_root` class
 *     <select dropdown>         ← `dropdown` class (hidden, overlaid)
 *     <span caption_label>      ← `caption_label` class (visible label + chevron)
 *       "June" / "2026" + <Chevron orientation="down" />
 *   </span>
 *
 *   <div dropdowns>             ← `dropdowns` class (wraps month + year)
 *     [month dropdown_root] [year dropdown_root]
 *   </div>
 *
 * The hidden <select> sits on top (absolute, opacity-0) so clicking the
 * visible caption_label span opens the native OS select.
 */

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

        // Non-dropdown plain label / also used as the visual label in each dropdown
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

        // ── Dropdown caption ──────────────────────────────────────────────
        // Container of month + year dropdowns
        dropdowns: 'flex items-center gap-1',

        // Wrapper span for each dropdown (month or year)
        dropdown_root: 'relative inline-flex items-center',

        // The actual <select> — invisible but clickable (sits on top)
        dropdown: 'absolute inset-0 z-10 cursor-pointer opacity-0',

        // months/years dropdown classnames (applied to the <select>)
        months_dropdown: '',
        years_dropdown: '',

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
      }}

      {...props}
    />
  )
}
