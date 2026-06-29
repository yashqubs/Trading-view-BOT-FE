import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip as RechartsTooltip, XAxis, YAxis } from 'recharts'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartSkeleton } from '@/components/common/PageSkeleton'
import { EmptyState } from '@/components/common/EmptyState'
import { ChartTooltip } from './ChartTooltip'

interface AreaChartCardProps<T> {
  title: string
  data: T[] | undefined
  xKey: keyof T & string
  yKey: keyof T & string
  loading?: boolean
}

export function AreaChartCard<T extends object>({
  title,
  data,
  xKey,
  yKey,
  loading,
}: AreaChartCardProps<T>) {
  if (loading) return <ChartSkeleton />

  return (
    <Card className="animate-fade-slide-in">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      {!data?.length ? (
        <EmptyState title="No data yet" description="Charts will populate once trades start logging." />
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={data as Record<string, unknown>[]} aria-label={title} role="img">
            <defs>
              <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="var(--border)" vertical={false} />
            <XAxis dataKey={xKey as any} stroke="var(--text-tertiary)" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="var(--text-tertiary)" fontSize={12} tickLine={false} axisLine={false} />
            <RechartsTooltip content={<ChartTooltip />} />
            <Area
              type="monotone"
              dataKey={yKey as any}
              stroke="var(--accent)"
              strokeWidth={2}
              fill="url(#areaFill)"
              animationDuration={400}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </Card>
  )
}
