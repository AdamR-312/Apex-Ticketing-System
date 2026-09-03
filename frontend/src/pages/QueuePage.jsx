import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import TicketList from '../components/TicketList'
import TicketDetail from '../components/TicketDetail'
import NewTicketModal from '../components/NewTicketModal'
import { resolveFolder, distinctTags, DEFAULT_FOLDER } from '../folders'
import {
  listUsers,
  createTicket,
  updateTicket,
  listComments,
  createComment,
  listActivity,
} from '../api'

const PRIORITY_RANK = { high: 0, medium: 1, low: 2 }

function matchesSearch(ticket, query, requesterName) {
  if (!query) return true
  const haystack = `${ticket.title} ${ticket.description} ${requesterName} ${ticket.tags.join(' ')}`.toLowerCase()
  return haystack.includes(query.toLowerCase())
}

function sortTickets(tickets, sortBy, usersById) {
  const sorted = [...tickets]
  switch (sortBy) {
    case 'updated_asc':
      return sorted.sort((a, b) => a.updated_at.localeCompare(b.updated_at))
    case 'priority':
      return sorted.sort((a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority])
    case 'requester':
      return sorted.sort((a, b) => {
        const nameA = usersById[a.created_by_id]?.name || ''
        const nameB = usersById[b.created_by_id]?.name || ''
        return nameA.localeCompare(nameB)
      })
    case 'due_date':
      return sorted.sort((a, b) => {
        if (!a.due_at && !b.due_at) return 0
        if (!a.due_at) return 1
        if (!b.due_at) return -1
        return a.due_at.localeCompare(b.due_at)
      })
    case 'updated_desc':
    default:
      return sorted.sort((a, b) => b.updated_at.localeCompare(a.updated_at))
  }
}

export default function QueuePage({ tickets, ticketsLoading, setTickets, starredIds, onToggleStar }) {
  const [searchParams, setSearchParams] = useSearchParams()
  const selectedFolderKey = searchParams.get('folder') || DEFAULT_FOLDER

  const [users, setUsers] = useState([])
  const [selectedTicketId, setSelectedTicketId] = useState(null)
  const [comments, setComments] = useState([])
  const [activity, setActivity] = useState([])
  const [isNewTicketOpen, setNewTicketOpen] = useState(false)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('updated_desc')
  const [selectedIds, setSelectedIds] = useState(() => new Set())

  const usersById = useMemo(() => Object.fromEntries(users.map((u) => [u.id, u])), [users])
  const allTags = useMemo(() => distinctTags(tickets), [tickets])
  const ctx = { starredIds }

  const folder = resolveFolder(selectedFolderKey)
  const ticketsInFolder = tickets.filter((t) => folder.filter(t, ctx))
  const isSearching = searchQuery.trim().length > 0
  // A non-empty search box searches every ticket, not just the open folder —
  // "search within Unassigned" is rarely what someone typing a query wants.
  const searchScope = isSearching ? tickets : ticketsInFolder
  const searchedTickets = searchScope.filter((t) =>
    matchesSearch(t, searchQuery, usersById[t.created_by_id]?.name || ''),
  )
  const visibleTickets = sortTickets(searchedTickets, sortBy, usersById)
  const selectedTicket = tickets.find((t) => t.id === selectedTicketId) ?? null

  useEffect(() => {
    listUsers().then(setUsers).catch((err) => setError(err.message))
  }, [])

  useEffect(() => {
    if (selectedTicketId == null && tickets.length > 0) {
      setSelectedTicketId(tickets[0].id)
    }
  }, [tickets, selectedTicketId])

  useEffect(() => {
    if (selectedTicketId == null) {
      setComments([])
      setActivity([])
      return
    }
    listComments(selectedTicketId).then(setComments).catch((err) => setError(err.message))
    listActivity(selectedTicketId).then(setActivity).catch((err) => setError(err.message))
  }, [selectedTicketId])

  useEffect(() => {
    const scope = searchQuery.trim() ? tickets : tickets.filter((t) => folder.filter(t, ctx))
    const stillVisible = scope.filter((t) =>
      matchesSearch(t, searchQuery, usersById[t.created_by_id]?.name || ''),
    )
    if (!stillVisible.some((t) => t.id === selectedTicketId)) {
      setSelectedTicketId(stillVisible[0]?.id ?? null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFolderKey, searchQuery])

  async function handleUpdateTicket(patch) {
    if (!selectedTicket) return
    try {
      const updated = await updateTicket(selectedTicket.id, patch)
      setTickets((prev) => prev.map((t) => (t.id === updated.id ? updated : t)))
      listActivity(selectedTicket.id).then(setActivity).catch(() => {})
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleAddComment(comment) {
    if (!selectedTicket) return
    try {
      const created = await createComment(selectedTicket.id, comment)
      setComments((prev) => [...prev, created])
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleCreateTicket(ticket) {
    try {
      const created = await createTicket(ticket)
      setTickets((prev) => [created, ...prev])
      setSearchParams({})
      setSelectedTicketId(created.id)
      setNewTicketOpen(false)
    } catch (err) {
      setError(err.message)
    }
  }

  function toggleSelect(id) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleSelectAll() {
    setSelectedIds((prev) => {
      const allSelected = visibleTickets.length > 0 && visibleTickets.every((t) => prev.has(t.id))
      if (allSelected) return new Set()
      return new Set(visibleTickets.map((t) => t.id))
    })
  }

  async function handleBulkUpdate(patch) {
    const ids = Array.from(selectedIds)
    try {
      const updated = await Promise.all(ids.map((id) => updateTicket(id, patch)))
      const updatedById = new Map(updated.map((t) => [t.id, t]))
      setTickets((prev) => prev.map((t) => updatedById.get(t.id) ?? t))
      setSelectedIds(new Set())
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleBulkAddTag(tag) {
    const targets = tickets.filter((t) => selectedIds.has(t.id))
    try {
      const updated = await Promise.all(
        targets.map((t) =>
          t.tags.includes(tag) ? t : updateTicket(t.id, { tags: [...t.tags, tag] }),
        ),
      )
      const updatedById = new Map(updated.map((t) => [t.id, t]))
      setTickets((prev) => prev.map((t) => updatedById.get(t.id) ?? t))
      setSelectedIds(new Set())
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <>
      {error && (
        <div className="error-banner" onClick={() => setError(null)}>
          {error} — click to dismiss
        </div>
      )}
      <div className="frame">
        <TicketList
          tickets={visibleTickets}
          loading={ticketsLoading}
          totalInFolder={ticketsInFolder.length}
          usersById={usersById}
          users={users}
          selectedId={selectedTicketId}
          onSelect={setSelectedTicketId}
          title={isSearching ? 'Search results' : folder.label}
          onNewTicket={() => setNewTicketOpen(true)}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          sortBy={sortBy}
          onSortChange={setSortBy}
          starredIds={starredIds}
          onToggleStar={onToggleStar}
          selectedIds={selectedIds}
          onToggleSelect={toggleSelect}
          onToggleSelectAll={toggleSelectAll}
          onClearSelection={() => setSelectedIds(new Set())}
          onBulkUpdate={handleBulkUpdate}
          onBulkAddTag={handleBulkAddTag}
        />
        <TicketDetail
          ticket={selectedTicket}
          usersById={usersById}
          users={users}
          comments={comments}
          activity={activity}
          allTags={allTags}
          isStarred={selectedTicket ? starredIds.has(selectedTicket.id) : false}
          onToggleStar={() => selectedTicket && onToggleStar(selectedTicket.id)}
          onUpdate={handleUpdateTicket}
          onAddComment={handleAddComment}
        />
      </div>
      {isNewTicketOpen && (
        <NewTicketModal
          users={users}
          onClose={() => setNewTicketOpen(false)}
          onCreate={handleCreateTicket}
        />
      )}
    </>
  )
}
