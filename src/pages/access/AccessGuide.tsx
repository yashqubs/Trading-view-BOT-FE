import {
  Briefcase,
  Globe,
  LayoutDashboard,
  Lock,
  Eye,
  EyeOff,
  LineChart,
  ListChecks,
  Power,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { Badge, type BadgeProps } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

type AccessLevel = 'full' | 'readonly' | 'hidden'

const ACCESS_LABEL: Record<AccessLevel, string> = {
  full: 'Full access',
  readonly: 'Read-only',
  hidden: 'Not visible',
}

const ACCESS_BADGE_VARIANT: Record<AccessLevel, BadgeProps['variant']> = {
  full: 'success',
  readonly: 'accent',
  hidden: 'neutral',
}

interface FeatureAccess {
  icon: LucideIcon
  name: string
  description: string
  admin: AccessLevel
  viewer: AccessLevel
  note?: string
}

const FEATURES: FeatureAccess[] = [
  {
    icon: LayoutDashboard,
    name: 'Dashboard',
    description: 'Global stats, charts, and alerts across every stock.',
    admin: 'full',
    viewer: 'full',
  },
  {
    icon: Power,
    name: 'Bot on/off switch',
    description: 'Master kill switch for all trading, in the top bar.',
    admin: 'full',
    viewer: 'readonly',
    note: 'Viewer can see the current status but the switch is disabled.',
  },
  {
    icon: LineChart,
    name: 'Stocks & stock config',
    description: 'Add stocks, map tickers to IG Epic codes, set investment amounts.',
    admin: 'full',
    viewer: 'hidden',
    note: 'Page and nav link are hidden entirely for Viewer.',
  },
  {
    icon: ShieldCheck,
    name: 'Stock detail & stats',
    description: "A single stock's charts, stats, and its own trading conditions.",
    admin: 'full',
    viewer: 'readonly',
    note: 'Viewer can open a stock page directly but has no Edit button.',
  },
  {
    icon: Globe,
    name: 'Markets',
    description: 'Search and manage the list of tradeable IG markets.',
    admin: 'full',
    viewer: 'hidden',
  },
  {
    icon: Briefcase,
    name: 'Open positions',
    description: 'Currently open positions pulled live from IG.',
    admin: 'full',
    viewer: 'readonly',
  },
  {
    icon: ListChecks,
    name: 'Trades',
    description: 'Full trade history, filterable, with CSV export.',
    admin: 'full',
    viewer: 'readonly',
    note: 'Viewer can filter and export, just like Admin — this page has no editable data.',
  },
  {
    icon: SlidersHorizontal,
    name: 'Trading conditions',
    description: 'Global rules: buy/sell allowed, daily limits, execution mode.',
    admin: 'full',
    viewer: 'readonly',
    note: 'Viewer sees every rule but every field is disabled.',
  },
  {
    icon: Users,
    name: 'Users',
    description: 'Create, edit, deactivate portal users and reset passwords.',
    admin: 'full',
    viewer: 'hidden',
  },
  {
    icon: Settings,
    name: 'Settings',
    description: 'Webhook URL, broker connection status, own password & 2FA.',
    admin: 'full',
    viewer: 'full',
    note: 'Both roles fully manage their own account — this page never shows other users.',
  },
]

function AccessBadge({ level }: { level: AccessLevel }) {
  return <Badge variant={ACCESS_BADGE_VARIANT[level]}>{ACCESS_LABEL[level]}</Badge>
}

export function AccessGuide() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-medium text-text-primary">Roles &amp; access</h1>
        <p className="text-sm text-text-secondary">
          What every feature does, and what an Admin vs. a Viewer can do with it.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Card className="flex-1 min-w-[220px] animate-fade-slide-in flex-row items-center gap-3 py-3">
          <ShieldCheck className="h-5 w-5 shrink-0 text-accent" />
          <div>
            <p className="text-sm font-medium text-text-primary">Admin</p>
            <p className="text-xs text-text-tertiary">Full access — every page, every setting, every user.</p>
          </div>
        </Card>
        <Card className="flex-1 min-w-[220px] animate-fade-slide-in flex-row items-center gap-3 py-3">
          <Eye className="h-5 w-5 shrink-0 text-text-secondary" />
          <div>
            <p className="text-sm font-medium text-text-primary">Viewer</p>
            <p className="text-xs text-text-tertiary">Read-only — dashboard, stats, and trade history.</p>
          </div>
        </Card>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="matrix">Permissions matrix</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => (
              <Card key={feature.name} className="animate-fade-slide-in">
                <CardHeader className="items-start justify-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-soft">
                    <feature.icon className="h-4 w-4 text-accent" />
                  </div>
                  <CardTitle className="text-sm normal-case tracking-normal text-text-primary">
                    {feature.name}
                  </CardTitle>
                </CardHeader>
                <p className="text-xs text-text-secondary">{feature.description}</p>
                <div className="mt-4 flex items-center gap-4 text-xs">
                  <span className="flex items-center gap-1.5 text-text-tertiary">
                    Admin <AccessBadge level={feature.admin} />
                  </span>
                  <span className="flex items-center gap-1.5 text-text-tertiary">
                    Viewer <AccessBadge level={feature.viewer} />
                  </span>
                </div>
                {feature.note && <p className="mt-2 text-xs text-text-tertiary">{feature.note}</p>}
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="matrix">
          <Card className="animate-fade-slide-in">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Feature</TableHead>
                  <TableHead>Admin</TableHead>
                  <TableHead>Viewer</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {FEATURES.map((feature) => (
                  <TableRow key={feature.name}>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <feature.icon className="h-4 w-4 shrink-0 text-text-tertiary" />
                        <div>
                          <p className="font-medium">{feature.name}</p>
                          <p className="text-xs text-text-tertiary">{feature.description}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <AccessBadge level={feature.admin} />
                    </TableCell>
                    <TableCell>
                      <AccessBadge level={feature.viewer} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

          <div className="mt-4 flex flex-wrap gap-4 text-xs text-text-tertiary">
            <span className="flex items-center gap-1.5">
              <Badge variant="success">Full access</Badge> can view and change
            </span>
            <span className="flex items-center gap-1.5">
              <Badge variant="accent">Read-only</Badge> can view, cannot change
            </span>
            <span className="flex items-center gap-1.5">
              <Badge variant="neutral">Not visible</Badge> page/action doesn't appear at all
            </span>
          </div>
        </TabsContent>
      </Tabs>

      <Card className="animate-fade-slide-in">
        <CardHeader>
          <CardTitle>Two roles, on purpose</CardTitle>
        </CardHeader>
        <div className="flex flex-col gap-2 text-sm text-text-secondary">
          <p className="flex items-start gap-2">
            <Lock className="mt-0.5 h-4 w-4 shrink-0 text-text-tertiary" />
            Every permission shown here is enforced on the backend, not just hidden in this UI — a Viewer
            account cannot perform a blocked action even by calling the API directly.
          </p>
          <p className="flex items-start gap-2">
            <EyeOff className="mt-0.5 h-4 w-4 shrink-0 text-text-tertiary" />
            Only one account is ever an Admin by default (the first user created during setup). Ask an Admin
            on the Users page to create or promote additional accounts.
          </p>
        </div>
      </Card>
    </div>
  )
}
