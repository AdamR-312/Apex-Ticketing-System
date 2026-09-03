import { useEffect, useMemo, useState } from 'react'
import { relativeTime, initials, isOverdue } from '../format'
import { listMacros } from '../api'

const STATUS_OPTIONS = ['open', 'in_progress', 'resolved', 'closed']
const STATUS_LABEL = {
  open: 'Open',
  in_progress: 'In progress',
  resolved: 'Resolved',
  closed: 'Closed',
}
const PRIORITY_OPTIONS = ['low', 'medium', 'high']
const TABS = [
  { key: 'conversation', label: 'Conversation' },
  { key: 'notes', label: 'Internal notes' },
  { key: 'history', label: 'History' },
]

function renderWithMentions(text, usersById) {
  const names = Object.values(usersById)
    .map((u) => u.name)
    .filter(Boolean)
    .sort((a, b) => b.length - a.length)
  if (names.length === 0) return text
  const escaped = names.map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  const re = new RegExp(`@(${escaped.join('|')})`, 'g')
  const parts = text.split(re)
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <span className="mention" key={i}>
        @{part}
      </span>
    ) : (
      part
    ),
  )
}

function formatDateInput(isoString) {
  if (!isoString) return ''
  return isoString.slice(0, 10)
}

export default function TicketDetail({
  ticket,
  usersById,
  users,
  comments,
  activity,
  allTags,
  isStarred,
  onToggleStar,
  onUpdate,
  onAddComment,
}) {
  const [activeTab, setActiveTab] = useState('conversation')
  const [reply, setReply] = useState('')
  const [mentionedIds, setMentionedIds] = useState([])
  const [sending, setSending] = useState(false)
  const [macros, setMacros] = useState([])
  const [tagInput, setTagInput] = useState('')

  useEffect(() => {
    listMacros().then(setMacros).catch(() => {})
  }, [])

  useEffect(() => {
    setReply('')
    setMentionedIds([])
  }, [activeTab, ticket?.id])

  const publicComments = useMemo(() => comments.filter((c) => !c.is_internal), [comments])
  const internalComments = useMemo(() => comments.filter((c) => c.is_internal), [comments])

  const mentionMatch = reply.match(/@(\w*)$/)
  const mentionQuery = mentionMatch ? mentionMatch[1].toLowerCase() : null
  const mentionSuggestions =
    mentionQuery !== null
      ? users.filter((u) => u.name.toLowerCase().includes(mentionQuery)).slice(0, 5)
      : []

  if (!ticket) {
    return (
      <div className="detail-col">
        <div className="empty-state">Select a ticket to view it.</div>
      </div>
    )
  }

  const requester = usersById[ticket.created_by_id]?.name || 'Unknown'

  async function handleSend() {
    if (!reply.trim()) return
    setSending(true)
    try {
      await onAddComment({
        body: reply.trim(),
        is_internal: activeTab === 'notes',
        mentioned_user_ids: mentionedIds,
      })
      setReply('')
      setMentionedIds([])
    } finally {
      setSending(false)
    }
  }

  function selectMention(user) {
    setReply((prev) => prev.replace(/@(\w*)$/, `@${user.name} `))
    setMentionedIds((prev) => Array.from(new Set([...prev, user.id])))
  }

  function insertMacro(macroId) {
    const macro = macros.find((m) => m.id === Number(macroId))
    if (!macro) return
    setReply((prev) => (prev.trim() ? `${prev}\n\n${macro.body}` : macro.body))
  }

  function handleAddTag(e) {
    e.preventDefault()
    const tag = tagInput.trim().toLowerCase()
    if (!tag || ticket.tags.includes(tag)) {
      setTagInput('')
      return
    }
    onUpdate({ tags: [...ticket.tags, tag] })
    setTagInput('')
  }

  function handleRemoveTag(tag) {
    onUpdate({ tags: ticket.tags.filter((t) => t !== tag) })
  }

  const overdue = isOverdue(ticket)

  return (
    <div className="detail-col">
      <div className="detail-scroll">
        <div className="detail-header">
          <div>
            <div className="detail-id">
              TICKET-{ticket.id}
              {overdue && <span className="pill overdue-pill">Overdue</span>}
            </div>
            <h1 className="detail-title">{ticket.title}</h1>
          </div>
          <div className="detail-controls">
            <button
              type="button"
              className={`star-btn${isStarred ? ' starred' : ''}`}
              onClick={onToggleStar}
              title={isStarred ? 'Unstar' : 'Star'}
              aria-pressed={isStarred}
            >
              {isStarred ? '★' : '☆'}
            </button>
            <select
              className="select-pill"
              value={ticket.status}
              onChange={(e) => onUpdate({ status: e.target.value })}
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABEL[s]}
                </option>
              ))}
            </select>
            <select
              className="select-pill"
              value={ticket.priority}
              onChange={(e) => onUpdate({ priority: e.target.value })}
            >
              {PRIORITY_OPTIONS.map((p) => (
                <option key={p} value={p}>
                  {p[0].toUpperCase() + p.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="properties-card">
          <div className="meta-row">
            <div className="meta-field">
              <div className="k">Requester</div>
              <div className="v">{requester}</div>
            </div>
            <div className="meta-field">
              <div className="k">Assignee</div>
              <div className="v">
                <select
                  className="assignee-select"
                  value={ticket.assigned_to_id ?? ''}
                  onChange={(e) =>
                    onUpdate({ assigned_to_id: e.target.value ? Number(e.target.value) : null })
                  }
                >
                  <option value="">Unassigned</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="meta-field">
              <div className="k">Due date</div>
              <div className="v">
                <input
                  type="date"
                  className="due-date-input"
                  value={formatDateInput(ticket.due_at)}
                  onChange={(e) =>
                    onUpdate({ due_at: e.target.value ? `${e.target.value}T00:00:00` : null })
                  }
                />
              </div>
            </div>
            <div className="meta-field">
              <div className="k">Created</div>
              <div className="v mono">{new Date(ticket.created_at + 'Z').toLocaleString()}</div>
            </div>
          </div>

          <div className="tags-row">
            <div className="k tags-row-label">Tags</div>
            {ticket.tags.map((tag) => (
              <span className="tag-chip" key={tag}>
                {tag}
                <button type="button" onClick={() => handleRemoveTag(tag)} aria-label={`Remove tag ${tag}`}>
                  ×
                </button>
              </span>
            ))}
            <form className="tag-add-form" onSubmit={handleAddTag}>
              <input
                list="tag-suggestions"
                placeholder="+ Add tag"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
              />
              <datalist id="tag-suggestions">
                {allTags.filter((t) => !ticket.tags.includes(t)).map((t) => (
                  <option value={t} key={t} />
                ))}
              </datalist>
            </form>
          </div>
        </div>

        <div className="message-card">
          <div className="thread-top">
            <div className="avatar">{initials(requester)}</div>
            <span className="thread-name">{requester}</span>
            <span className="pill original-pill">Original request</span>
            <span className="thread-time">{relativeTime(ticket.created_at)}</span>
          </div>
          <div className="message-card-subject">{ticket.title}</div>
          <div className="message-card-body">{ticket.description}</div>
        </div>

        <div className="tabs-bar">
          {TABS.map((tab) => {
            const count =
              tab.key === 'conversation'
                ? publicComments.length
                : tab.key === 'notes'
                  ? internalComments.length
                  : activity.length
            return (
              <button
                key={tab.key}
                type="button"
                className={`tab-btn${activeTab === tab.key ? ' active' : ''}`}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
                <span className="tab-count">{count}</span>
              </button>
            )
          })}
        </div>

        <div className="tab-panel">
          {activeTab === 'conversation' &&
            (publicComments.length === 0 ? (
              <div className="empty-state">No replies yet.</div>
            ) : (
              publicComments.map((c) => (
                <div className="thread-item" key={c.id}>
                  <div className="thread-top">
                    <div className="avatar">{initials(usersById[c.author_id]?.name || 'Unknown')}</div>
                    <span className="thread-name">{usersById[c.author_id]?.name || 'Unknown'}</span>
                    <span className="thread-time">{relativeTime(c.created_at)}</span>
                  </div>
                  <div className="thread-text">{renderWithMentions(c.body, usersById)}</div>
                </div>
              ))
            ))}

          {activeTab === 'notes' &&
            (internalComments.length === 0 ? (
              <div className="empty-state">No internal notes yet.</div>
            ) : (
              internalComments.map((c) => (
                <div className="thread-item internal" key={c.id}>
                  <div className="thread-top">
                    <div className="avatar">{initials(usersById[c.author_id]?.name || 'Unknown')}</div>
                    <span className="thread-name">{usersById[c.author_id]?.name || 'Unknown'}</span>
                    <span className="thread-time">{relativeTime(c.created_at)}</span>
                  </div>
                  <div className="thread-text">{renderWithMentions(c.body, usersById)}</div>
                </div>
              ))
            ))}

          {activeTab === 'history' &&
            (activity.length === 0 ? (
              <div className="empty-state">No activity yet.</div>
            ) : (
              activity.map((a) => (
                <div className="activity-item" key={a.id}>
                  <span className="activity-actor">{usersById[a.actor_id]?.name || 'Someone'}</span>{' '}
                  {a.message}
                  <span className="activity-time"> · {relativeTime(a.created_at)}</span>
                </div>
              ))
            ))}
        </div>
      </div>

      {activeTab !== 'history' && (
        <div className={`composer${activeTab === 'notes' ? ' composer-internal' : ''}`}>
          <div className="composer-input-wrap">
            <textarea
              placeholder={
                activeTab === 'notes'
                  ? 'Write an internal note — type @ to tag a teammate…'
                  : `Reply to ${requester.split(' ')[0]}…`
              }
              value={reply}
              onChange={(e) => setReply(e.target.value)}
            />
            {mentionSuggestions.length > 0 && (
              <div className="mention-suggestions">
                {mentionSuggestions.map((u) => (
                  <button type="button" key={u.id} onClick={() => selectMention(u)}>
                    {u.name}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="composer-actions">
            {macros.length > 0 && (
              <select
                className="macro-picker"
                value=""
                onChange={(e) => {
                  insertMacro(e.target.value)
                  e.target.value = ''
                }}
              >
                <option value="" disabled>
                  Insert macro…
                </option>
                {macros.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.title}
                  </option>
                ))}
              </select>
            )}
            <button className="btn" onClick={handleSend} disabled={sending || !reply.trim()}>
              {sending ? 'Sending…' : activeTab === 'notes' ? 'Add note' : 'Send reply'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
