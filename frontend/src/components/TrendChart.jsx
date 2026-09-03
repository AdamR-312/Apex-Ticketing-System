export default function TrendChart({ data, color = 'var(--accent)' }) {
  const maxValue = Math.max(1, ...data.map((d) => d.value))
  const peakIndex = data.reduce((best, d, i) => (d.value > data[best].value ? i : best), 0)

  return (
    <div className="trendchart">
      {data.map((d, i) => {
        const pct = (d.value / maxValue) * 100
        return (
          <div
            className="trendchart-col"
            key={d.key}
            tabIndex={0}
            title={`${d.fullLabel}: ${d.value} ticket${d.value === 1 ? '' : 's'}`}
          >
            {i === peakIndex && d.value > 0 && <div className="trendchart-peak">{d.value}</div>}
            <div
              className="trendchart-bar"
              style={{ height: `${pct}%`, minHeight: d.value > 0 ? '3px' : 0, background: color }}
            />
            <div className="trendchart-axis">{d.label}</div>
          </div>
        )
      })}
    </div>
  )
}
