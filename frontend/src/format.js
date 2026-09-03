export function relativeTime(isoString) {
  const then = new Date(isoString + 'Z').getTime()
  const diffSeconds = Math.round((Date.now() - then) / 1000)

  if (diffSeconds < 60) return 'just now'
  const diffMinutes = Math.round(diffSeconds / 60)
  if (diffMinutes < 60) return `${diffMinutes}m`
  const diffHours = Math.round(diffMinutes / 60)
  if (diffHours < 24) return `${diffHours}h`
  const diffDays = Math.round(diffHours / 24)
  if (diffDays < 7) return `${diffDays}d`
  const diffWeeks = Math.round(diffDays / 7)
  return `${diffWeeks}w`
}

export function absoluteTime(isoString) {
  return new Date(isoString + 'Z').toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

export function initials(name) {
  return name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export function isOverdue(ticket) {
  if (!ticket.due_at || ticket.status === 'resolved' || ticket.status === 'closed') return false
  return new Date(ticket.due_at + 'Z').getTime() < Date.now()
}
