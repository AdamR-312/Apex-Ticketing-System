import { useEffect, useState } from 'react'
import { listMacros, createMacro, updateMacro, deleteMacro } from '../api'
import { useToast } from '../components/Toast'

export default function MacrosPage() {
  const [macros, setMacros] = useState([])
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState(null)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [saving, setSaving] = useState(false)
  const [query, setQuery] = useState('')
  const showToast = useToast()

  function refresh() {
    setLoading(true)
    setError(null)
    listMacros()
      .then(setMacros)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(refresh, [])

  function startNew() {
    setEditingId('new')
    setTitle('')
    setBody('')
  }

  function startEdit(macro) {
    setEditingId(macro.id)
    setTitle(macro.title)
    setBody(macro.body)
  }

  function cancelEdit() {
    setEditingId(null)
  }

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    try {
      if (editingId === 'new') {
        await createMacro({ title, body })
        showToast('Macro created.')
      } else {
        await updateMacro(editingId, { title, body })
        showToast('Macro saved.')
      }
      setEditingId(null)
      refresh()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    try {
      await deleteMacro(id)
      showToast('Macro deleted.')
      refresh()
    } catch (err) {
      setError(err.message)
    }
  }

  const visibleMacros = macros.filter((m) => {
    const q = query.trim().toLowerCase()
    if (!q) return true
    return m.title.toLowerCase().includes(q) || m.body.toLowerCase().includes(q)
  })

  return (
    <div className="page-panel">
      <div className="page-header">
        <h1>Macros</h1>
        <p>Reusable reply templates agents can insert into a ticket's reply box.</p>
      </div>

      {error && (
        <div className="error-banner" onClick={() => setError(null)}>
          {error} — click to dismiss
          <button type="button" className="retry-btn" onClick={(e) => { e.stopPropagation(); refresh() }}>
            Retry
          </button>
        </div>
      )}

      {editingId ? (
        <form className="settings-form macro-form" onSubmit={handleSave}>
          <label>
            Title
            <input value={title} onChange={(e) => setTitle(e.target.value)} required autoFocus />
          </label>
          <label>
            Body
            <textarea value={body} onChange={(e) => setBody(e.target.value)} required rows={4} />
          </label>
          <div className="settings-form-actions">
            <button type="button" className="btn ghost" onClick={cancelEdit}>
              Cancel
            </button>
            <button type="submit" className="btn" disabled={saving}>
              {saving ? 'Saving…' : 'Save macro'}
            </button>
          </div>
        </form>
      ) : (
        <div className="macro-toolbar">
          <button className="btn macro-new-btn" onClick={startNew}>
            + New macro
          </button>
          {macros.length > 0 && (
            <input
              type="search"
              className="search-input macro-search"
              placeholder="Search macros…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          )}
        </div>
      )}

      <div className="macro-list">
        {visibleMacros.map((m) => (
          <div className="macro-card" key={m.id}>
            <div className="macro-card-top">
              <h3>{m.title}</h3>
              <div className="macro-card-actions">
                <button className="btn ghost" onClick={() => startEdit(m)}>
                  Edit
                </button>
                <button className="btn ghost" onClick={() => handleDelete(m.id)}>
                  Delete
                </button>
              </div>
            </div>
            <p className="macro-card-body">{m.body}</p>
          </div>
        ))}
        {loading && <p className="empty-state">Loading…</p>}
        {!loading && macros.length === 0 && <p className="empty-state">No macros yet — add one above.</p>}
        {!loading && macros.length > 0 && visibleMacros.length === 0 && (
          <p className="empty-state">No macros match "{query}".</p>
        )}
      </div>
    </div>
  )
}
