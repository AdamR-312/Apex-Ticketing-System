import { useEffect, useState } from 'react'
import { listTickets, listUsers } from '../api'
import StatTile from '../components/StatTile'
import BarChart from '../components/BarChart'
import TrendChart from '../components/TrendChart'
import { isOverdue } from '../format'

const STATUS_ORDER = [
  { key: 'open', label: 'Open', color: 'var(--accent)' },
  { key: 'in_progress', label: 'In progress', color: 'var(--warning)' },
  { key: 'resolved', label: 'Resolved', color: 'var(--success)' },
  { key: 'closed', label: 'Closed', color: 'var(--ink-faint)' },
]

const PRIORITY_ORDER = [
  { key: 'high', label: 'High', color: 'var(--danger)' },
  { key: 'medium', label: 'Medium', color: 'var(--warning)' },
  { key: 'low', label: 'Low', color: 'var(--neutral-chip)' },
]

const RANGE_OPTIONS = [7, 14, 30, 90]

function buildDailyTrend(tickets, rangeDays) {
  const days = []
  for (let i = rangeDays - 1; i >= 0; i--) {
    const d = new Date()
    d.setUTCHours(0, 0, 0, 0)
    d.setUTCDate(d.getUTCDate() - i)
    days.push(d)
  }
  const counts = new Map(days.map((d) => [d.toISOString().slice(0, 10), 0]))
  tickets.forEach((t) => {
    const day = t.created_at.slice(0, 10)
    if (counts.has(day)) counts.set(day, counts.get(day) + 1)
  })
  return days.map((d) => {
    const key = d.toISOString().slice(0, 10)
    return {
      key,
      value: counts.get(key),
      label: `${d.getUTCMonth() + 1}/${d.getUTCDate()}`,
      fullLabel: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    }
  })
}

export default function DashboardPage() {
  const [tickets, setTickets] = useState([])
  const [users, setUsers] = useState([])
  const [error, setError] = useState(null)
  const [rangeDays, setRangeDays] = useState(14)

  function refresh() {
    setError(null)
    Promise.all([listTickets(), listUsers()])
      .then(([t, u]) => {
        setTickets(t)
        setUsers(u)
      })
      .catch((err) => setError(err.message))
  }

  useEffect(refresh, [])

  const openCount = tickets.filter((t) => t.status === 'open' || t.status === 'in_progress').length
  const unassignedCount = tickets.filter((t) => t.assigned_to_id == null).length
  const highPriorityOpenCount = tickets.filter(
    (t) => t.priority === 'high' && (t.status === 'open' || t.status === 'in_progress'),
  ).length
  const overdueCount = tickets.filter(isOverdue).length

  const statusData = STATUS_ORDER.map((s) => ({
    key: s.key,
    label: s.label,
    color: s.color,
    value: tickets.filter((t) => t.status === s.key).length,
  }))

  const priorityData = PRIORITY_ORDER.map((p) => ({
    key: p.key,
    label: p.label,
    color: p.color,
    value: tickets.filter((t) => t.priority === p.key).length,
  }))

  const agentData = users
    .map((u) => ({
      key: u.id,
      label: u.name,
      color: 'var(--accent)',
      value: tickets.filter(
        (t) => t.assigned_to_id === u.id && (t.status === 'open' || t.status === 'in_progress'),
      ).length,
    }))
    .filter((d) => d.value > 0)
    .sort((a, b) => b.value - a.value)

  const trend = buildDailyTrend(tickets, rangeDays)

  return (
    <div className="page-panel">
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>Ticket volume and team stats, computed live from the current queue.</p>
      </div>

      {error && (
        <div className="error-banner" onClick={() => setError(null)}>
          {error} — click to dismiss
          <button type="button" className="retry-btn" onClick={(e) => { e.stopPropagation(); refresh() }}>
            Retry
          </button>
        </div>
      )}

      <div className="kpi-row">
        <StatTile label="Total tickets" value={tickets.length} to="/" />
        <StatTile label="Open + in progress" value={openCount} />
        <StatTile label="Unassigned" value={unassignedCount} to="/?folder=unassigned" />
        <StatTile label="High priority open" value={highPriorityOpenCount} to="/?folder=p-high" />
        <StatTile label="Overdue" value={overdueCount} />
        <StatTile label="Team members" value={users.length} to="/team" />
      </div>

      <div className="dash-grid">
        <div className="dash-card">
          <h2>Tickets by status</h2>
          <BarChart data={statusData} />
        </div>
        <div className="dash-card">
          <h2>Tickets by priority</h2>
          <BarChart data={priorityData} />
        </div>
      </div>

      <div className="dash-card">
        <div className="dash-card-header">
          <h2>Tickets created — last {rangeDays} days</h2>
          <div className="range-toggle">
            {RANGE_OPTIONS.map((n) => (
              <button
                key={n}
                type="button"
                className={`range-btn${n === rangeDays ? ' active' : ''}`}
                onClick={() => setRangeDays(n)}
              >
                {n}d
              </button>
            ))}
          </div>
        </div>
        <TrendChart data={trend} />
      </div>

      {agentData.length > 0 && (
        <div className="dash-card">
          <h2>Open workload by agent</h2>
          <BarChart data={agentData} />
        </div>
      )}
    </div>
  )
}
