import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getSettings, updateSettings, createUser } from '../api'
import { useToast } from '../components/Toast'

const ROLE_OPTIONS = ['user', 'agent', 'admin']

export default function SettingsPage() {
  const [settings, setSettings] = useState(null)
  const [siteName, setSiteName] = useState('')
  const [supportEmail, setSupportEmail] = useState('')
  const [defaultPriority, setDefaultPriority] = useState('medium')
  const [savingSettings, setSavingSettings] = useState(false)
  const [settingsSaved, setSettingsSaved] = useState(false)

  const [newName, setNewName] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newRole, setNewRole] = useState('user')
  const [creating, setCreating] = useState(false)
  const [createResult, setCreateResult] = useState(null)

  const [error, setError] = useState(null)
  const showToast = useToast()

  function fetchSettings() {
    setError(null)
    getSettings()
      .then((s) => {
        setSettings(s)
        setSiteName(s.site_name)
        setSupportEmail(s.support_email)
        setDefaultPriority(s.default_priority)
      })
      .catch((err) => setError(err.message))
  }

  useEffect(fetchSettings, [])

  async function handleSaveSettings(e) {
    e.preventDefault()
    setSavingSettings(true)
    setSettingsSaved(false)
    try {
      const updated = await updateSettings({
        site_name: siteName,
        support_email: supportEmail,
        default_priority: defaultPriority,
      })
      setSettings(updated)
      setSettingsSaved(true)
      showToast('Settings saved.')
    } catch (err) {
      setError(err.message)
    } finally {
      setSavingSettings(false)
    }
  }

  async function handleCreateAccount(e) {
    e.preventDefault()
    setCreating(true)
    setCreateResult(null)
    try {
      const user = await createUser({
        name: newName,
        email: newEmail,
        password: newPassword,
        role: newRole,
      })
      setCreateResult({ ok: true, message: `Created ${user.role} account for ${user.email}.` })
      showToast(`Account created for ${user.email}.`)
      setNewName('')
      setNewEmail('')
      setNewPassword('')
      setNewRole('user')
    } catch (err) {
      setCreateResult({ ok: false, message: err.message })
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="page-panel">
      <div className="page-header">
        <h1>Settings</h1>
        <p>Site configuration and account creation for power users.</p>
      </div>

      {error && (
        <div className="error-banner" onClick={() => setError(null)}>
          {error} — click to dismiss
          <button
            type="button"
            className="retry-btn"
            onClick={(e) => {
              e.stopPropagation()
              fetchSettings()
            }}
          >
            Retry
          </button>
        </div>
      )}

      <div className="settings-warning">
        No login exists yet — anyone who can reach this page (or the API directly) can create an
        admin account. This will be gated once auth ships.
      </div>

      <section className="settings-section">
        <h2>Site options</h2>
        {settings ? (
          <form className="settings-form" onSubmit={handleSaveSettings}>
            <label>
              Site name
              <input value={siteName} onChange={(e) => setSiteName(e.target.value)} required />
            </label>
            <label>
              Support email
              <input
                type="email"
                value={supportEmail}
                onChange={(e) => setSupportEmail(e.target.value)}
                required
              />
            </label>
            <label>
              Default ticket priority
              <select value={defaultPriority} onChange={(e) => setDefaultPriority(e.target.value)}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </label>
            <div className="settings-form-actions">
              {settingsSaved && <span className="settings-saved">Saved</span>}
              <button className="btn" type="submit" disabled={savingSettings}>
                {savingSettings ? 'Saving…' : 'Save settings'}
              </button>
            </div>
          </form>
        ) : (
          <p className="empty-state">Loading…</p>
        )}
        {settings && (
          <p className="settings-hint">
            Customers email in at <span className="mono">ticket-&lt;id&gt;@{settings.ticket_reply_domain}</span>{' '}
            — replies route back to the matching ticket automatically.
          </p>
        )}
      </section>

      <section className="settings-section">
        <h2>Create account</h2>
        <p className="settings-hint">
          Need to change a role or deactivate someone instead? Manage existing accounts on the{' '}
          <Link to="/team">Team page</Link>.
        </p>
        <form className="settings-form" onSubmit={handleCreateAccount}>
          <label>
            Name
            <input value={newName} onChange={(e) => setNewName(e.target.value)} required />
          </label>
          <label>
            Email
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              required
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
            />
          </label>
          <label>
            Role
            <select value={newRole} onChange={(e) => setNewRole(e.target.value)}>
              {ROLE_OPTIONS.map((r) => (
                <option key={r} value={r}>
                  {r[0].toUpperCase() + r.slice(1)}
                </option>
              ))}
            </select>
          </label>
          <div className="settings-form-actions">
            {createResult && (
              <span className={createResult.ok ? 'settings-saved' : 'settings-error-text'}>
                {createResult.message}
              </span>
            )}
            <button className="btn" type="submit" disabled={creating}>
              {creating ? 'Creating…' : 'Create account'}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}
