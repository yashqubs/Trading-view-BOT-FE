import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { ChevronsLeft, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/context/AuthContext'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { NAV_ITEMS } from './nav-items'

const STORAGE_KEY = 'sidebar-collapsed'

export function Sidebar() {
  const { user } = useAuth()
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem(STORAGE_KEY) === 'true')

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev
      localStorage.setItem(STORAGE_KEY, String(next))
      return next
    })
  }

  return (
    <TooltipProvider delayDuration={200}>
      <aside
        className={cn(
          'relative hidden flex-col border-r border-border bg-surface py-5 shadow-[var(--shadow-card)] transition-[width] duration-200 md:flex',
          collapsed ? 'w-[68px] px-2' : 'w-56 px-3',
        )}
      >
        {/* Top accent line */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-accent/70 via-stat-violet/50 to-transparent" />

        <div className={cn('mb-6 flex items-center gap-2.5', collapsed ? 'justify-center px-0' : 'px-2')}>
          <span className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-accent to-stat-violet text-accent-foreground shadow-[0_0_16px_rgb(var(--accent-rgb)/0.45)]">
            <TrendingUp className="h-4 w-4" />
          </span>
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold tracking-tight text-text-primary">Trading bot</p>
              <p className="truncate text-xs text-text-tertiary">Admin portal</p>
            </div>
          )}
        </div>

        <nav className="flex flex-1 flex-col gap-1">
          {NAV_ITEMS.filter((item) => !item.adminOnly || user?.role === 'ADMIN').map((item) => {
            const link = (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    'group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    collapsed && 'justify-center px-0',
                    isActive
                      ? 'bg-accent-soft text-accent'
                      : 'text-text-secondary hover:bg-surface-2 hover:text-text-primary',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <span className="absolute left-0 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-full bg-accent" />
                    )}
                    <item.icon
                      className={cn(
                        'h-4 w-4 shrink-0 transition-transform duration-150 group-hover:scale-105',
                        isActive && 'text-accent',
                      )}
                    />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </>
                )}
              </NavLink>
            )

            if (!collapsed) return link

            return (
              <Tooltip key={item.to}>
                <TooltipTrigger asChild>{link}</TooltipTrigger>
                <TooltipContent side="right">{item.label}</TooltipContent>
              </Tooltip>
            )
          })}
        </nav>

        <button
          type="button"
          onClick={toggleCollapsed}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className={cn(
            'mt-2 flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-text-tertiary',
            'transition-colors hover:bg-surface-2 hover:text-text-primary',
            collapsed && 'justify-center px-0',
          )}
        >
          <ChevronsLeft className={cn('h-4 w-4 shrink-0 transition-transform duration-200', collapsed && 'rotate-180')} />
          {!collapsed && <span>Collapse</span>}
        </button>
      </aside>
    </TooltipProvider>
  )
}
