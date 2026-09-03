import { useRef, useState } from 'react'
import { relativeTime, absoluteTime, initials, isOverdue } from '../format'

const STATUS_LABEL = {
  open: 'Open',
  in_progress: 'In progress',
  resolved: 'Resolved',
  closed: 'Closed',
}

const SORT_OPTIONS = [
  { key: 'updated_desc', label: 'Newest' },
  { key: 'updated_asc', label: 'Oldest' },
  { key: 'priority', label: 'Priority' },
  { key: 'requester', label: 'Requester A–Z' },
  { key: 'due_date', label: 'Due date' },
]

export default function TicketList({
  tickets,
  loading,
  usersById,
  users,
  selectedId,
  onSelect,
  title,
  onNewTicket,
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
  totalInFolder,
  starredIds,
  onToggleStar,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  onClearSelection,
  onBulkUpdate,
  onBulkAddTag,
}) {
  const isFiltered = searchQuery.trim().length > 0
  const rowRefs = useRef({})
  const bulkCount = selectedIds.size
  const allSelected = tickets.length > 0 && tickets.every((t) => selectedIds.has(t.id))
  const [bulkTagInput, setBulkTagInput] = useState('')

  function moveSelection(fromId, delta) {
    const index = tickets.findIndex((t) => t.id === fromId)
    const nextIndex = Math.min(Math.max(index + delta, 0), tickets.length - 1)
    const next = tickets[nextIndex]
    if (!next) return
    onSelect(next.id)
    rowRefs.current[next.id]?.focus()
  }

  return (
    <div className="list-col">
      <div className="list-toolbar">
        <h2>{title}</h2>
        <div className="list-toolbar-right">
          <span className="count">
            {isFiltered ? `${tickets.length} of ${totalInFolder}` : `${tickets.length} tickets`}
          </span>
          <button className="btn" onClick={onNewTicket}>
            + New
          </button>
        </div>
      </div>
      <div className="list-filter-row">
        <input
          type="search"
          className="search-input"
          placeholder="Search subject, description, requester…"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        <select className="sort-select" value={sortBy} onChange={(e) => onSortChange(e.target.value)}>
          {SORT_OPTIONS.map((o) => (
            <option key={o.key} value={o.key}>
              Sort: {o.label}
            </option>
          ))}
        </select>
      </div>

      {bulkCount > 0 ? (
        <div className="bulk-bar">
          <label className="bulk-select-all">
            <input type="checkbox" checked={allSelected} onChange={onToggleSelectAll} />
            {bulkCount} selected
          </label>
          <select
            className="bulk-select"
            defaultValue=""
            onChange={(e) => {
              if (e.target.value) onBulkUpdate({ status: e.target.value })
              e.target.value = ''
            }}
          >
            <option value="" disabled>
              Set status…
            </option>
            <option value="open">Open</option>
            <option value="in_progress">In progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
          <select
            className="bulk-select"
            defaultValue=""
            onChange={(e) => {
              onBulkUpdate({ assigned_to_id: e.target.value ? Number(e.target.value) : null })
              e.target.value = ''
            }}
          >
            <option value="" disabled>
              Assign to…
            </option>
            <option value="">Unassigned</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
          <select
            className="bulk-select"
            defaultValue=""
            onChange={(e) => {
              if (e.target.value) onBulkUpdate({ priority: e.target.value })
              e.target.value = ''
            }}
          >
            <option value="" disabled>
              Set priority…
            </option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <form
            className="bulk-tag-form"
            onSubmit={(e) => {
              e.preventDefault()
              const tag = bulkTagInput.trim().toLowerCase()
              if (!tag) return
              onBulkAddTag(tag)
              setBulkTagInput('')
            }}
          >
            <input
              placeholder="+ Add tag to selection"
              value={bulkTagInput}
              onChange={(e) => setBulkTagInput(e.target.value)}
            />
          </form>
          <button className="btn ghost bulk-clear" onClick={onClearSelection}>
            Clear
          </button>
        </div>
      ) : (
        tickets.length > 0 && (
          <div className="bulk-bar bulk-bar-idle">
            <label className="bulk-select-all">
              <input type="checkbox" checked={false} onChange={onToggleSelectAll} />
              Select all
            </label>
          </div>
        )
      )}

      <div className="list-scroll">
        {tickets.length === 0 && (
          <div className="empty-state">
            {loading
              ? 'Loading…'
              : isFiltered
                ? `No tickets match "${searchQuery}".`
                : 'No tickets here.'}
          </div>
        )}
        {tickets.map((t) => {
          const requester = usersById[t.created_by_id]?.name || 'Unknown'
          const starred = starredIds.has(t.id)
          return (
            <div
              key={t.id}
              ref={(el) => {
                rowRefs.current[t.id] = el
              }}
              className={`trow p-${t.priority}${t.id === selectedId ? ' selected' : ''}`}
              onClick={() => onSelect(t.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  onSelect(t.id)
                } else if (e.key === 'ArrowDown') {
                  e.preventDefault()
                  moveSelection(t.id, 1)
                } else if (e.key === 'ArrowUp') {
                  e.preventDefault()
                  moveSelection(t.id, -1)
                }
              }}
              role="button"
              tabIndex={0}
              aria-current={t.id === selectedId}
            >
              <input
                type="checkbox"
                className="trow-checkbox"
                checked={selectedIds.has(t.id)}
                onClick={(e) => e.stopPropagation()}
                onChange={() => onToggleSelect(t.id)}
                aria-label={`Select ticket ${t.title}`}
              />
              <div className="avatar">{initials(requester)}</div>
              <div className="trow-body">
                <div className="trow-top">
                  <span className="trow-name">{requester}</span>
                  <span className="trow-time" title={absoluteTime(t.updated_at)}>
                    {relativeTime(t.updated_at)}
                  </span>
                </div>
                <div className="trow-subject">{t.title}</div>
                <div className="trow-preview">{t.description}</div>
                <div className="trow-meta">
                  <span className={`pill ${t.status}`}>{STATUS_LABEL[t.status]}</span>
                  {isOverdue(t) && <span className="pill overdue-pill">Overdue</span>}
                  {t.tags.map((tag) => (
                    <span className="tag-chip small" key={tag}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <button
                type="button"
                className={`star-btn row-star${starred ? ' starred' : ''}`}
                onClick={(e) => {
                  e.stopPropagation()
                  onToggleStar(t.id)
                }}
                title={starred ? 'Unstar' : 'Star'}
                aria-pressed={starred}
              >
                {starred ? '★' : '☆'}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
