import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { DayPicker, type DayPickerProps } from 'react-day-picker'
import { cn } from '@/lib/utils'

export type CalendarProps = DayPickerProps

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
        months: 'flex flex-col gap-6 sm:flex-row',

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
          'hover:bg-surface-2 hover:text-text-primary',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
          'disabled:pointer-events-none disabled:opacity-30',
        ),
        button_next: cn(
          'absolute right-0 top-0',
          'inline-flex h-9 w-9 items-center justify-center rounded-lg',
          'text-text-tertiary transition-colors duration-150',
          'hover:bg-surface-2 hover:text-text-primary',
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

        // ── Day button <button> ───────────────────────────────────────────
        day_button: cn(
          'inline-flex h-9 w-9 items-center justify-center',
          'rounded-full text-sm font-normal',
          'text-text-primary transition-colors duration-100',
          'hover:bg-surface-2',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
          'aria-disabled:pointer-events-none aria-disabled:opacity-30',
        ),

        // ── Range band on <td> ────────────────────────────────────────────
        range_start:  'bg-accent/15 rounded-l-full',
        range_end:    'bg-accent/15 rounded-r-full',
        range_middle: 'bg-accent/15',

        // ── Selected → child <button> styling via [&>button]: ─────────────
        selected: cn(
          '[&>button]:bg-accent',
          '[&>button]:text-accent-foreground',
          '[&>button]:rounded-full',
          '[&>button]:font-semibold',
          '[&>button]:shadow-[0_0_0_2px_var(--surface),0_0_0_3.5px_var(--accent)]',
        ),

        today: cn(
          '[&>button]:ring-2',
          '[&>button]:ring-inset',
          '[&>button]:ring-accent',
          '[&>button]:text-accent',
          '[&>button]:font-semibold',
        ),

        outside:  'opacity-40',
        disabled: 'opacity-30 pointer-events-none',
        hidden:   'invisible',

        ...externalClassNames,
      }}

      modifiersClassNames={{
        range_middle: cn(
          'bg-accent/15 rounded-none',
          '[&>button]:!bg-transparent',
          '[&>button]:!shadow-none',
          '[&>button]:!text-text-primary',
          '[&>button]:!font-normal',
          '[&>button]:!rounded-none',
        ),
      }}

      components={{
        Chevron: ({ orientation }) => {
          if (orientation === 'left')  return <ChevronLeft  className="h-4 w-4" />
          if (orientation === 'right') return <ChevronRight className="h-4 w-4" />
          return <ChevronDown className="h-3 w-3 opacity-60" />
        },
      }}

      {...props}
    />
  )
}
