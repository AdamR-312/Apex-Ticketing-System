export default function BarChart({ data }) {
  const maxValue = Math.max(1, ...data.map((d) => d.value))

  return (
    <div className="barchart">
      {data.map((d) => {
        const pct = (d.value / maxValue) * 100
        return (
          <div
            className="barchart-row"
            key={d.key}
            tabIndex={0}
            title={`${d.label}: ${d.value}`}
          >
            <div className="barchart-label">{d.label}</div>
            <div className="barchart-track">
              <div
                className="barchart-fill"
                style={{
                  width: `${pct}%`,
                  minWidth: d.value > 0 ? '3px' : 0,
                  background: d.color,
                }}
              />
            </div>
            <div className="barchart-value">{d.value}</div>
          </div>
        )
      })}
    </div>
  )
}
