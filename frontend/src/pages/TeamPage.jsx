import { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { listUsers, listTickets, updateUser } from '../api'
import { initials } from '../format'
import { useToast } from '../components/Toast'

const ROLE_LABEL = { user: 'User', agent: 'Agent', admin: 'Admin' }
const ROLE_OPTIONS = ['user', 'agent', 'admin']

export default function TeamPage() {
  const [users, setUsers] = useState([])
  const [tickets, setTickets] = useState([])
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)
  const [searchParams] = useSearchParams()
  const highlightId = Number(searchParams.get('user')) || null
  const rowRefs = useRef({})
  const showToast = useToast()

  const refresh = useCallback(() => {
    setLoading(true)
    setError(null)
    Promise.all([listUsers(), listTickets()])
      .then(([u, t]) => {
        setUsers(u)
        setTickets(t)
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  useEffect(refresh, [refresh])

  useEffect(() => {
    if (highlightId && rowRefs.current[highlightId]) {
      rowRefs.current[highlightId].scrollIntoView({ block: 'center', behavior: 'smooth' })
    }
  }, [highlightId, users])

  async function handleRoleChange(user, role) {
    try {
      const updated = await updateUser(user.id, { role })
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)))
      showToast(`${updated.name} is now ${ROLE_LABEL[updated.role]}.`)
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleToggleActive(user) {
    try {
      const updated = await updateUser(user.id, { is_active: !user.is_active })
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)))
      showToast(updated.is_active ? `${updated.name} reactivated.` : `${updated.name} deactivated.`)
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="page-panel">
      <div className="page-header">
        <h1>Team</h1>
        <p>Everyone with an account, and how many open tickets they're carrying.</p>
      </div>

      {error && (
        <div className="error-banner" onClick={() => setError(null)}>
          {error} — click to dismiss
          <button type="button" className="retry-btn" onClick={(e) => { e.stopPropagation(); refresh() }}>
            Retry
          </button>
        </div>
      )}

      <table className="team-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Role</th>
            <th>Assigned (open)</th>
            <th>Assigned (all)</th>
            <th>Tickets filed</th>
            <th>Account</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => {
            const assignedAll = tickets.filter((t) => t.assigned_to_id === u.id)
            const assignedOpen = assignedAll.filter((t) => t.status === 'open' || t.status === 'in_progress')
            const createdCount = tickets.filter((t) => t.created_by_id === u.id).length
            return (
              <tr
                key={u.id}
                ref={(el) => {
                  rowRefs.current[u.id] = el
                }}
                className={[
                  u.id === highlightId ? 'team-row-highlight' : '',
                  u.is_active ? '' : 'team-row-inactive',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                <td>
                  <div className="team-name-cell">
                    <span className="avatar">{initials(u.name)}</span>
                    <div>
                      <div className="team-name">{u.name}</div>
                      <a className="team-email" href={`mailto:${u.email}`}>
                        {u.email}
                      </a>
                    </div>
                  </div>
                </td>
                <td>
                  <select
                    className="role-select"
                    value={u.role}
                    onChange={(e) => handleRoleChange(u, e.target.value)}
                  >
                    {ROLE_OPTIONS.map((r) => (
                      <option key={r} value={r}>
                        {ROLE_LABEL[r]}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="mono">{assignedOpen.length}</td>
                <td className="mono">{assignedAll.length}</td>
                <td className="mono">{createdCount}</td>
                <td>
                  <button type="button" className="btn ghost" onClick={() => handleToggleActive(u)}>
                    {u.is_active ? 'Deactivate' : 'Reactivate'}
                  </button>
                </td>
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
