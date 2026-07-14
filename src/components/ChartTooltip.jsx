export function ChartTooltip({ active, payload, label, prefix = "", suffix = "", suffixK = false }) {
  if (!active || !payload || payload.length === 0) return null
  return (
    <div className="glass-strong rounded-xl border border-border px-3 py-2 shadow-lg">
      {label && <p className="mb-1.5 text-xs font-semibold text-foreground">{label}</p>}
      <div className="space-y-1">
        {payload.map((entry) => (
          <div key={entry.dataKey} className="flex items-center gap-2 text-xs">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color || entry.stroke }} />
            <span className="text-muted-foreground">{entry.name}</span>
            <span className="ml-auto font-semibold text-foreground">
              {prefix}
              {entry.value?.toLocaleString()}
              {suffixK ? "K" : ""}
              {suffix}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
