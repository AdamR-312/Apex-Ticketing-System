import { useEffect, useState } from 'react'
import { listUsers, listTickets } from '../api'
import { initials } from '../format'

const ROLE_LABEL = { user: 'User', agent: 'Agent', admin: 'Admin' }

export default function TeamPage() {
  const [users, setUsers] = useState([])
  const [tickets, setTickets] = useState([])
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([listUsers(), listTickets()])
      .then(([u, t]) => {
        setUsers(u)
        setTickets(t)
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="page-panel">
      <div className="page-header">
        <h1>Team</h1>
        <p>Everyone with an account, and how many open tickets they're carrying.</p>
      </div>

      {error && <div className="error-banner" onClick={() => setError(null)}>{error} — click to dismiss</div>}

      <table className="team-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Role</th>
            <th>Assigned (open)</th>
            <th>Assigned (all)</th>
            <th>Tickets filed</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => {
            const assignedAll = tickets.filter((t) => t.assigned_to_id === u.id)
            const assignedOpen = assignedAll.filter((t) => t.status === 'open' || t.status === 'in_progress')
            const createdCount = tickets.filter((t) => t.created_by_id === u.id).length
            return (
              <tr key={u.id}>
                <td>
                  <div className="team-name-cell">
                    <span className="avatar">{initials(u.name)}</span>
                    <div>
                      <div className="team-name">{u.name}</div>
                      <div className="team-email">{u.email}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <span className={`pill role-${u.role}`}>{ROLE_LABEL[u.role]}</span>
                </td>
                <td className="mono">{assignedOpen.length}</td>
                <td className="mono">{assignedAll.length}</td>
                <td className="mono">{createdCount}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
      {loading && <p className="empty-state">Loading…</p>}
      {!loading && users.length === 0 && !error && <p className="empty-state">No accounts yet.</p>}
    </div>
  )
}
