import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip as RechartsTooltip, XAxis, YAxis } from 'recharts'
import { Maximize2 } from 'lucide-react'
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
  height?: number
  onExpand?: () => void
  /** Skips the Card/title chrome — for reuse inside a modal that already has its own header. */
  bare?: boolean
}

export function LineChartCard<T extends object>({
  title,
  data,
  xKey,
  yKey,
  yLabel,
  loading,
  height = 220,
  onExpand,
  bare,
}: LineChartCardProps<T>) {
  if (loading) return <ChartSkeleton />

  const chart = !data?.length ? (
    <EmptyState title="No data yet" description="Charts will populate once trades start logging." />
  ) : (
    <ResponsiveContainer width="100%" height={height}>
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
  )

  if (bare) return chart

  return (
    <Card className="animate-fade-slide-in">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {onExpand && (
          <button
            type="button"
            onClick={onExpand}
            aria-label={`Expand ${title}`}
            className="rounded-md p-1 text-text-tertiary transition-colors hover:bg-surface-2 hover:text-text-primary"
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </button>
        )}
      </CardHeader>
      {chart}
    </Card>
  )
}
