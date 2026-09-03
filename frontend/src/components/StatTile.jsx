import { Link } from 'react-router-dom'

export default function StatTile({ label, value, sublabel, to }) {
  const content = (
    <>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      {sublabel && <div className="stat-sublabel">{sublabel}</div>}
    </>
  )

  if (to) {
    return (
      <Link className="stat-tile stat-tile-link" to={to}>
        {content}
      </Link>
    )
  }

  return <div className="stat-tile">{content}</div>
}
