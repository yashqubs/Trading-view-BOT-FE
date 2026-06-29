import { BotToggle } from './BotToggle'
import { ThemeToggle } from './ThemeToggle'
import { UserMenu } from './UserMenu'

export function TopBar() {
  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-surface px-4 md:px-6">
      <div className="md:hidden">
        <p className="text-sm font-medium text-text-primary">Trading bot</p>
      </div>
      <div className="flex flex-1 items-center justify-end gap-3">
        <BotToggle />
        <ThemeToggle />
        <UserMenu />
      </div>
    </header>
  )
}
