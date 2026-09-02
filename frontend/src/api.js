const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

export async function listTickets() {
  const res = await fetch(`${API_URL}/tickets`)
  if (!res.ok) throw new Error('Failed to load tickets')
  return res.json()
}

export async function createTicket(ticket) {
  const res = await fetch(`${API_URL}/tickets`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(ticket),
  })
  if (!res.ok) throw new Error('Failed to create ticket')
  return res.json()
}
