import { useState } from 'react'
import { CURRENT_USER_ID } from '../config'

export default function NewTicketModal({ users, onClose, onCreate }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState('medium')
  const [requesterId, setRequesterId] = useState(CURRENT_USER_ID)
  const [assigneeId, setAssigneeId] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [tagsInput, setTagsInput] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const isDirty = title.trim() !== '' || description.trim() !== ''

  function requestClose() {
    if (isDirty && !window.confirm('Discard this ticket? Your draft will be lost.')) return
    onClose()
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    try {
      const tags = tagsInput
        .split(',')
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean)
      await onCreate({
        title,
        description,
        priority,
        created_by_id: Number(requesterId),
        assigned_to_id: assigneeId ? Number(assigneeId) : null,
        due_at: dueDate ? `${dueDate}T00:00:00` : null,
        tags,
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="modal-scrim" onClick={requestClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>New ticket</h2>
        <form onSubmit={handleSubmit}>
          <label>
            Title
            <input value={title} onChange={(e) => setTitle(e.target.value)} required autoFocus />
          </label>
          <label>
            Description
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </label>
          <div className="modal-row">
            <label>
              Requester
              <select value={requesterId} onChange={(e) => setRequesterId(e.target.value)}>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Priority
              <select value={priority} onChange={(e) => setPriority(e.target.value)}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </label>
          </div>
          <div className="modal-row">
            <label>
              Assignee
              <select value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)}>
                <option value="">Unassigned</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Due date
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </label>
          </div>
          <label>
            Tags
            <input
              placeholder="billing, vip (comma separated)"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
            />
          </label>
          <div className="modal-actions">
            <button type="button" className="btn ghost" onClick={requestClose}>
              Cancel
            </button>
            <button type="submit" className="btn" disabled={submitting}>
              {submitting ? 'Creating…' : 'Create ticket'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
