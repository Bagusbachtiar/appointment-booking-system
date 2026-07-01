import React, { useState, useEffect } from 'react'
import { NavLink } from 'react-router-dom'

const links = [
  { to: '/',             label: 'Dashboard',    icon: '▦' },
  { to: '/appointments', label: 'Appointments', icon: '☰' },
]

export default function Sidebar() {
  return (
    <aside className="w-56 shrink-0 bg-zinc-950 border-r border-zinc-800 flex flex-col">
      <div className="px-6 py-5 border-b border-zinc-800">
        <p className="text-white font-semibold text-sm leading-tight">Bright Smile</p>
        <p className="text-zinc-600 font-mono text-[10px] tracking-widest uppercase mt-0.5">Dental Clinic</p>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {links.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            end
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-emerald-400/10 text-emerald-400 font-medium'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`
            }
          >
            <span className="text-base leading-none">{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-4 py-4 border-t border-zinc-800">
        <BackendStatus />
      </div>
    </aside>
  )
}

function BackendStatus() {
  const [ok, setOk] = useState(null)

  useEffect(() => {
    const check = () =>
      fetch('/api/appointments')
        .then(() => setOk(true))
        .catch(() => setOk(false))
    check()
    const t = setInterval(check, 30000)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="flex items-center gap-2">
      <span className={`w-1.5 h-1.5 rounded-full ${ok === null ? 'bg-zinc-600' : ok ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
      <span className="font-mono text-[10px] text-zinc-600 uppercase tracking-widest">
        {ok === null ? 'Checking…' : ok ? 'API Online' : 'API Offline'}
      </span>
    </div>
  )
}
