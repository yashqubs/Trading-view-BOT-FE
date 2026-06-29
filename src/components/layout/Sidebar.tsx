import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { useAuth } from '@/context/AuthContext'
import { NAV_ITEMS } from './nav-items'

export function Sidebar() {
  const { user } = useAuth()

  return (
    <aside className="hidden w-56 flex-col border-r border-border bg-surface px-3 py-5 md:flex">
      <div className="mb-6 px-2">
        <p className="text-sm font-medium text-text-primary">Trading bot</p>
        <p className="text-xs text-text-tertiary">Admin portal</p>
      </div>
      <nav className="flex flex-col gap-1">
        {NAV_ITEMS.filter((item) => !item.adminOnly || user?.role === 'ADMIN').map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-accent-soft text-accent'
                  : 'text-text-secondary hover:bg-surface-2 hover:text-text-primary',
              )
            }
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
