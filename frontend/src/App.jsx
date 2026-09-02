import { useEffect, useState } from 'react'
import { createTicket, listTickets } from './api'
import './App.css'

function App() {
  const [tickets, setTickets] = useState([])
  const [error, setError] = useState(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState('medium')

  function refresh() {
    listTickets()
      .then(setTickets)
      .catch((err) => setError(err.message))
  }

  useEffect(refresh, [])

  async function handleSubmit(e) {
    e.preventDefault()
    try {
      await createTicket({ title, description, priority })
      setTitle('')
      setDescription('')
      setPriority('medium')
      refresh()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <main>
      <h1>Ticket System</h1>

      {error && <p className="error">{error}</p>}

      <form onSubmit={handleSubmit}>
        <input
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <textarea
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />
        <select value={priority} onChange={(e) => setPriority(e.target.value)}>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
        <button type="submit">Create Ticket</button>
      </form>

      <ul className="ticket-list">
        {tickets.map((t) => (
          <li key={t.id}>
            <strong>{t.title}</strong> — {t.status} ({t.priority})
            <p>{t.description}</p>
          </li>
        ))}
      </ul>
    </main>
  )
}

export default App
