import { useEffect, useState } from 'react'
import { listMacros, createMacro, updateMacro, deleteMacro } from '../api'

export default function MacrosPage() {
  const [macros, setMacros] = useState([])
  const [error, setError] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [saving, setSaving] = useState(false)

  function refresh() {
    listMacros().then(setMacros).catch((err) => setError(err.message))
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
      } else {
        await updateMacro(editingId, { title, body })
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
      refresh()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="page-panel">
      <div className="page-header">
        <h1>Macros</h1>
        <p>Reusable reply templates agents can insert into a ticket's reply box.</p>
      </div>

      {error && <div className="error-banner" onClick={() => setError(null)}>{error} — click to dismiss</div>}

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
        <button className="btn macro-new-btn" onClick={startNew}>
          + New macro
        </button>
      )}

      <div className="macro-list">
        {macros.map((m) => (
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
        {macros.length === 0 && <p className="empty-state">No macros yet — add one above.</p>}
      </div>
    </div>
  )
}
