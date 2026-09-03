export default function StatTile({ label, value, sublabel }) {
  return (
    <div className="stat-tile">
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      {sublabel && <div className="stat-sublabel">{sublabel}</div>}
    </div>
  )
}
