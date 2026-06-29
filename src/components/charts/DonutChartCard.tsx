import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts'
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
}: {
  title: string
  data: DonutDatum[] | undefined
  loading?: boolean
}) {
  if (loading) return <ChartSkeleton />

  const total = data?.reduce((sum, d) => sum + d.value, 0) ?? 0

  return (
    <Card className="animate-fade-slide-in">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      {!data?.length || total === 0 ? (
        <EmptyState title="No data yet" description="Charts will populate once trades start logging." />
      ) : (
        <ResponsiveContainer width="100%" height={220}>
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
      )}
    </Card>
  )
}
