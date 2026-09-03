const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

async function request(path, options) {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    throw new Error(`${options?.method || 'GET'} ${path} failed: ${res.status}`)
  }
  return res.status === 204 ? null : res.json()
}

export const listTickets = () => request('/tickets')
export const getTicket = (id) => request(`/tickets/${id}`)
export const createTicket = (ticket) =>
  request('/tickets', { method: 'POST', body: JSON.stringify(ticket) })
export const updateTicket = (id, patch) =>
  request(`/tickets/${id}`, { method: 'PATCH', body: JSON.stringify(patch) })

export const listComments = (ticketId) => request(`/tickets/${ticketId}/comments`)
export const createComment = (ticketId, comment) =>
  request(`/tickets/${ticketId}/comments`, {
    method: 'POST',
    body: JSON.stringify(comment),
  })

export const listActivity = (ticketId) => request(`/tickets/${ticketId}/activity`)

export const listUsers = () => request('/users')
export const createUser = (user) => request('/users', { method: 'POST', body: JSON.stringify(user) })

export const getSettings = () => request('/settings')
export const updateSettings = (patch) =>
  request('/settings', { method: 'PATCH', body: JSON.stringify(patch) })

export const listMacros = () => request('/macros')
export const createMacro = (macro) =>
  request('/macros', { method: 'POST', body: JSON.stringify(macro) })
export const updateMacro = (id, patch) =>
  request(`/macros/${id}`, { method: 'PATCH', body: JSON.stringify(patch) })
export const deleteMacro = (id) => request(`/macros/${id}`, { method: 'DELETE' })
