import { CURRENT_USER_ID } from './config'

export const FOLDER_GROUPS = [
  {
    label: 'Queues',
    items: [
      { key: 'my', label: 'My Queue', filter: (t) => t.assigned_to_id === CURRENT_USER_ID },
      { key: 'unassigned', label: 'Unassigned', filter: (t) => t.assigned_to_id == null },
      {
        key: 'starred',
        label: 'Starred',
        filter: (t, ctx) => !!ctx?.starredIds?.has(t.id),
      },
      { key: 'all', label: 'All Tickets', filter: () => true },
    ],
  },
  {
    label: 'Priority',
    items: [
      { key: 'p-high', label: 'High', dotClass: 'priority-dot high', filter: (t) => t.priority === 'high' },
      { key: 'p-medium', label: 'Medium', dotClass: 'priority-dot medium', filter: (t) => t.priority === 'medium' },
      { key: 'p-low', label: 'Low', dotClass: 'priority-dot low', filter: (t) => t.priority === 'low' },
    ],
  },
  {
    label: 'Status',
    items: [
      { key: 's-open', label: 'Open', dotClass: 'status-dot open', filter: (t) => t.status === 'open' },
      { key: 's-progress', label: 'In progress', dotClass: 'status-dot in_progress', filter: (t) => t.status === 'in_progress' },
      { key: 's-resolved', label: 'Resolved', dotClass: 'status-dot resolved', filter: (t) => t.status === 'resolved' },
      { key: 's-closed', label: 'Closed', dotClass: 'status-dot closed', filter: (t) => t.status === 'closed' },
    ],
  },
]

export const ALL_FOLDERS = FOLDER_GROUPS.flatMap((g) => g.items)
export const DEFAULT_FOLDER = 'all'

export function distinctTags(tickets) {
  const set = new Set()
  tickets.forEach((t) => t.tags.forEach((tag) => set.add(tag)))
  return Array.from(set).sort()
}

export function resolveFolder(key) {
  if (key?.startsWith('tag:')) {
    const tag = key.slice(4)
    return { key, label: `#${tag}`, filter: (t) => t.tags.includes(tag) }
  }
  const found = ALL_FOLDERS.find((f) => f.key === key)
  if (found) return found
  return { key: DEFAULT_FOLDER, label: 'All Tickets', filter: () => true }
}
