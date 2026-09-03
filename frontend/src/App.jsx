import { useEffect, useState } from 'react'
import { HashRouter, Routes, Route } from 'react-router-dom'
import PrimaryNav from './components/PrimaryNav'
import QueuePage from './pages/QueuePage'
import DashboardPage from './pages/DashboardPage'
import TeamPage from './pages/TeamPage'
import MacrosPage from './pages/MacrosPage'
import SettingsPage from './pages/SettingsPage'
import { ToastProvider } from './components/Toast'
import { listTickets } from './api'
import './App.css'

const STARRED_STORAGE_KEY = 'apex.starredTicketIds'

function loadStarredIds() {
  try {
    return new Set(JSON.parse(localStorage.getItem(STARRED_STORAGE_KEY) || '[]'))
  } catch {
    return new Set()
  }
}

function App() {
  const [tickets, setTickets] = useState([])
  const [ticketsLoading, setTicketsLoading] = useState(true)
  const [starredIds, setStarredIds] = useState(loadStarredIds)

  useEffect(() => {
    listTickets()
      .then(setTickets)
      .catch(() => {})
      .finally(() => setTicketsLoading(false))
  }, [])

  useEffect(() => {
    localStorage.setItem(STARRED_STORAGE_KEY, JSON.stringify([...starredIds]))
  }, [starredIds])

  function toggleStar(ticketId) {
    setStarredIds((prev) => {
      const next = new Set(prev)
      if (next.has(ticketId)) next.delete(ticketId)
      else next.add(ticketId)
      return next
    })
  }

  return (
    <ToastProvider>
      <HashRouter>
        <div className="app">
          <div className="shell">
            <PrimaryNav tickets={tickets} starredIds={starredIds} />
            <div className="page-area">
              <Routes>
                <Route
                  path="/"
                  element={
                    <QueuePage
                      tickets={tickets}
                      ticketsLoading={ticketsLoading}
                      setTickets={setTickets}
                      starredIds={starredIds}
                      onToggleStar={toggleStar}
                    />
                  }
                />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/team" element={<TeamPage />} />
                <Route path="/macros" element={<MacrosPage />} />
                <Route path="/settings" element={<SettingsPage />} />
              </Routes>
            </div>
          </div>
        </div>
      </HashRouter>
    </ToastProvider>
  )
}

export default App
