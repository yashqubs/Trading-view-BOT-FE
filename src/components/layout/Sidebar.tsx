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
          'hidden flex-col border-r border-border bg-surface py-5 transition-[width] duration-200 md:flex',
          collapsed ? 'w-[68px] px-2' : 'w-56 px-3',
        )}
      >
        <div className={cn('mb-6 flex items-center gap-2', collapsed ? 'justify-center px-0' : 'px-2')}>
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
            <TrendingUp className="h-4 w-4" />
          </span>
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-text-primary">Trading bot</p>
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
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    collapsed && 'justify-center px-0',
                    isActive
                      ? 'bg-accent-soft text-accent'
                      : 'text-text-secondary hover:bg-surface-2 hover:text-text-primary',
                  )
                }
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {!collapsed && <span className="truncate">{item.label}</span>}
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
