import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, XAxis, YAxis } from 'recharts'
import { Maximize2 } from 'lucide-react'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartSkeleton } from '@/components/common/PageSkeleton'
import { EmptyState } from '@/components/common/EmptyState'
import { ChartTooltip } from './ChartTooltip'

interface BarChartCardProps<T> {
  title: string
  data: T[] | undefined
  xKey: keyof T & string
  yKey: keyof T & string
  loading?: boolean
  horizontal?: boolean
  colors?: string[]
  height?: number
  onExpand?: () => void
  /** Skips the Card/title chrome — for reuse inside a modal that already has its own header. */
  bare?: boolean
}

export function BarChartCard<T extends object>({
  title,
  data,
  xKey,
  yKey,
  loading,
  horizontal,
  colors,
  height,
  onExpand,
  bare,
}: BarChartCardProps<T>) {
  if (loading) return <ChartSkeleton />

  const chart = !data?.length ? (
    <EmptyState title="No data yet" description="Charts will populate once trades start logging." />
  ) : (
    <ResponsiveContainer width="100%" height={height ?? Math.max(220, horizontal ? data.length * 36 : 220)}>
      <BarChart
        data={data as Record<string, unknown>[]}
        layout={horizontal ? 'vertical' : 'horizontal'}
        aria-label={title}
        role="img"
      >
        <CartesianGrid stroke="var(--border)" horizontal={!horizontal} vertical={horizontal} />
        {horizontal ? (
          <>
            <XAxis type="number" stroke="var(--text-tertiary)" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis dataKey={xKey as any} type="category" stroke="var(--text-tertiary)" fontSize={12} tickLine={false} axisLine={false} width={80} />
          </>
        ) : (
          <>
            <XAxis dataKey={xKey as any} stroke="var(--text-tertiary)" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="var(--text-tertiary)" fontSize={12} tickLine={false} axisLine={false} />
          </>
        )}
        <RechartsTooltip content={<ChartTooltip />} cursor={{ fill: 'var(--surface-2)' }} />
        <Bar dataKey={yKey as any} radius={[4, 4, 4, 4]} animationDuration={400}>
          {data.map((_, index) => (
            <Cell key={index} fill={colors?.[index] ?? 'var(--accent)'} />
          ))}
        </Bar>
      </BarChart>
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
