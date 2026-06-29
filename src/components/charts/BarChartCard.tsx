import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, XAxis, YAxis } from 'recharts'
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
}

export function BarChartCard<T extends object>({
  title,
  data,
  xKey,
  yKey,
  loading,
  horizontal,
  colors,
}: BarChartCardProps<T>) {
  if (loading) return <ChartSkeleton />

  return (
    <Card className="animate-fade-slide-in">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      {!data?.length ? (
        <EmptyState title="No data yet" description="Charts will populate once trades start logging." />
      ) : (
        <ResponsiveContainer width="100%" height={Math.max(220, horizontal ? data.length * 36 : 220)}>
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
      )}
    </Card>
  )
}
