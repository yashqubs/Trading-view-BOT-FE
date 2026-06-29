import { toast } from 'sonner'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import { useSetBotEnabled, useTradingRules } from '@/hooks/useRules'
import { useAuth } from '@/context/AuthContext'
import { cn } from '@/lib/utils'

export function BotToggle() {
  const { user } = useAuth()
  const { data: rules, isLoading } = useTradingRules()
  const setBotEnabled = useSetBotEnabled()

  if (isLoading || !rules) {
    return <Skeleton className="h-8 w-32 rounded-full" />
  }

  const isAdmin = user?.role === 'ADMIN'

  function handleToggle(checked: boolean) {
    setBotEnabled.mutate(checked, {
      onSuccess: () => toast.success(checked ? 'Bot enabled' : 'Bot disabled'),
      onError: () => toast.error('Could not update bot status'),
    })
  }

  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-full border border-border px-3 py-1.5',
        rules.botEnabled ? 'bg-accent-soft' : 'bg-surface-2',
      )}
    >
      <span className={cn('text-xs font-medium', rules.botEnabled ? 'text-accent' : 'text-text-secondary')}>
        Bot {rules.botEnabled ? 'on' : 'off'}
      </span>
      <Switch
        checked={rules.botEnabled}
        onCheckedChange={handleToggle}
        disabled={!isAdmin || setBotEnabled.isPending}
        aria-label="Toggle bot trading"
      />
    </div>
  )
}
