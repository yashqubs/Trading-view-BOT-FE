import {
  LayoutDashboard,
  LineChart,
  ListChecks,
  Settings,
  SlidersHorizontal,
  Users,
  type LucideIcon,
} from 'lucide-react'

export interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  end?: boolean
  adminOnly?: boolean
}

export const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/stocks', label: 'Stocks', icon: LineChart },
  { to: '/trades', label: 'Trades', icon: ListChecks },
  { to: '/conditions', label: 'Conditions', icon: SlidersHorizontal },
  { to: '/users', label: 'Users', icon: Users, adminOnly: true },
  { to: '/settings', label: 'Settings', icon: Settings },
]
