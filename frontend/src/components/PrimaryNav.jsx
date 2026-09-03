import { useEffect, useState } from 'react'
import { NavLink, useLocation, useSearchParams } from 'react-router-dom'
import { FOLDER_GROUPS, distinctTags } from '../folders'

const PAGES = [
  { to: '/', label: 'Queue', end: true },
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/team', label: 'Team' },
  { to: '/macros', label: 'Macros' },
  { to: '/settings', label: 'Settings' },
]

const THEME_KEY = 'apex.theme'

function loadTheme() {
  const stored = localStorage.getItem(THEME_KEY)
  if (stored === 'dark' || stored === 'light') return stored
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function useTheme() {
  const [theme, setTheme] = useState(loadTheme)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem(THEME_KEY, theme)
  }, [theme])

  return [theme, setTheme]
}

export default function PrimaryNav({ tickets, starredIds }) {
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const [theme, setTheme] = useTheme()
  const isQueueActive = location.pathname === '/'
  const selectedFolder = searchParams.get('folder') || 'all'
  const ctx = { starredIds }

  const tagGroup = {
    label: 'Tags',
    items: distinctTags(tickets).map((tag) => ({
      key: `tag:${tag}`,
      label: `#${tag}`,
      filter: (t) => t.tags.includes(tag),
    })),
  }
  const groups = tagGroup.items.length > 0 ? [...FOLDER_GROUPS, tagGroup] : FOLDER_GROUPS
  const unassignedCount = tickets.filter((t) => t.assigned_to_id == null).length

  return (
    <nav className="primary-nav">
      <div className="brand">
        <span className="mark">A</span>
        <span>Apex</span>
      </div>
      <div className="nav-group">
        {PAGES.map((page) => (
          <div key={page.to}>
            <NavLink
              to={page.to}
              end={page.end}
              className={({ isActive }) => `nav-item${isActive ? ' selected' : ''}`}
            >
              <span className="left">{page.label}</span>
              {page.to === '/' && !isQueueActive && unassignedCount > 0 && (
                <span className="count" title={`${unassignedCount} unassigned`}>
                  {unassignedCount}
                </span>
              )}
            </NavLink>
            {page.to === '/' && isQueueActive && (
              <div className="folder-tree">
                {groups.map((group) => (
                  <div className="folder-group" key={group.label}>
                    <div className="folder-group-label">{group.label}</div>
                    {group.items.map((item) => {
                      const count = tickets.filter((t) => item.filter(t, ctx)).length
                      return (
                        <button
                          key={item.key}
                          type="button"
                          className={`nav-item folder-item${item.key === selectedFolder ? ' selected' : ''}`}
                          onClick={() =>
                            setSearchParams(item.key === 'all' ? {} : { folder: item.key })
                          }
                        >
                          <span className="left">
                            {item.dotClass && <span className={`dot ${item.dotClass}`} />}
                            {item.label}
                          </span>
                          <span className="count">{count}</span>
                        </button>
                      )
                    })}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      <button
        type="button"
        className="theme-toggle"
        onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
        title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {theme === 'dark' ? '☀️ Light mode' : '🌙 Dark mode'}
      </button>
    </nav>
  )
}
