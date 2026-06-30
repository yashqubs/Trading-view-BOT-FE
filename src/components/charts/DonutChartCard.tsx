import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts'
import { Maximize2 } from 'lucide-react'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartSkeleton } from '@/components/common/PageSkeleton'
import { EmptyState } from '@/components/common/EmptyState'
import { ChartTooltip } from './ChartTooltip'

interface DonutDatum {
  name: string
  value: number
}

const COLORS = ['var(--accent)', 'var(--text-tertiary)', 'var(--warning)', 'var(--danger)']

export function DonutChartCard({
  title,
  data,
  loading,
  height = 220,
  onExpand,
  bare,
}: {
  title: string
  data: DonutDatum[] | undefined
  loading?: boolean
  height?: number
  onExpand?: () => void
  /** Skips the Card/title chrome — for reuse inside a modal that already has its own header. */
  bare?: boolean
}) {
  if (loading) return <ChartSkeleton />

  const total = data?.reduce((sum, d) => sum + d.value, 0) ?? 0

  const chart = !data?.length || total === 0 ? (
    <EmptyState title="No data yet" description="Charts will populate once trades start logging." />
  ) : (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart aria-label={title} role="img">
        <Pie data={data} dataKey="value" nameKey="name" innerRadius={55} outerRadius={80} paddingAngle={2} animationDuration={400}>
          {data.map((entry, index) => (
            <Cell key={entry.name} fill={COLORS[index % COLORS.length]} stroke="var(--surface)" />
          ))}
        </Pie>
        <Legend wrapperStyle={{ fontSize: 12, color: 'var(--text-secondary)' }} />
        <RechartsTooltip content={<ChartTooltip />} />
      </PieChart>
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
