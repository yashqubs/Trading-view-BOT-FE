interface ChartTooltipPayloadEntry {
  dataKey?: string | number
  name?: string | number
  value?: string | number
}

interface ChartTooltipProps {
  active?: boolean
  payload?: ChartTooltipPayloadEntry[]
  label?: string | number
}

export function ChartTooltip({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-md border border-border bg-surface-2 px-3 py-2 text-xs shadow-lg">
      {label !== undefined && <p className="mb-1 text-text-tertiary">{label}</p>}
      {payload.map((entry, index) => (
        <p key={entry.dataKey ?? index} className="text-text-primary">
          <span className="text-text-secondary">{entry.name}: </span>
          {entry.value}
        </p>
      ))}
    </div>
  )
}
