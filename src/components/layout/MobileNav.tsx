import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { useAuth } from '@/context/AuthContext'
import { NAV_ITEMS } from './nav-items'

export function MobileNav() {
  const { user } = useAuth()

  return (
    <nav className="flex items-center gap-1 overflow-x-auto border-b border-border bg-surface px-2 py-2 md:hidden">
      {NAV_ITEMS.filter((item) => !item.adminOnly || user?.role === 'ADMIN').map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) =>
            cn(
              'flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
              isActive
                ? 'bg-accent-soft text-accent'
                : 'text-text-secondary hover:bg-surface-2 hover:text-text-primary',
            )
          }
        >
          <item.icon className="h-3.5 w-3.5" />
          {item.label}
        </NavLink>
      ))}
    </nav>
  )
}
