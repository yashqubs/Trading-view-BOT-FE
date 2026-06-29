import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip as RechartsTooltip, XAxis, YAxis } from 'recharts'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartSkeleton } from '@/components/common/PageSkeleton'
import { EmptyState } from '@/components/common/EmptyState'
import { ChartTooltip } from './ChartTooltip'

interface LineChartCardProps<T> {
  title: string
  data: T[] | undefined
  xKey: keyof T & string
  yKey: keyof T & string
  yLabel?: string
  loading?: boolean
}

export function LineChartCard<T extends object>({
  title,
  data,
  xKey,
  yKey,
  yLabel,
  loading,
}: LineChartCardProps<T>) {
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
          <LineChart data={data as Record<string, unknown>[]} aria-label={title} role="img">
            <CartesianGrid stroke="var(--border)" vertical={false} />
            <XAxis dataKey={xKey as any} stroke="var(--text-tertiary)" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis
              stroke="var(--text-tertiary)"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              label={
                yLabel
                  ? { value: yLabel, angle: -90, position: 'insideLeft', fill: 'var(--text-tertiary)', fontSize: 11 }
                  : undefined
              }
            />
            <RechartsTooltip content={<ChartTooltip />} />
            <Line type="monotone" dataKey={yKey as any} stroke="var(--accent)" strokeWidth={2} dot={false} animationDuration={400} />
          </LineChart>
        </ResponsiveContainer>
      )}
    </Card>
  )
}
