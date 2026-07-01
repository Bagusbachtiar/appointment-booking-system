import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format, parseISO } from 'date-fns'
import { fetchAppointments, cancelAppointment } from '../api/appointments'
import StatusBadge from '../components/StatusBadge'
import ServicePill from '../components/ServicePill'
import CancelModal from '../components/CancelModal'

export default function Appointments() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterDate, setFilterDate] = useState('')
  const [cancelTarget, setCancelTarget] = useState(null)
  const [toast, setToast] = useState(null)

  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ['appointments'],
    queryFn: () => fetchAppointments(),
    refetchInterval: 60000,
  })

  const cancelMutation = useMutation({
    mutationFn: (eventId) => cancelAppointment(eventId),
    onSuccess: (_, eventId) => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
      setCancelTarget(null)
      showToast('Appointment cancelled', 'success')
    },
    onError: () => {
      showToast('Failed to cancel', 'error')
    },
  })

  function showToast(msg, type) {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const filtered = useMemo(() => {
    return appointments.filter(a => {
      if (filterStatus && a.status !== filterStatus) return false
      if (filterDate && a.date !== filterDate) return false
      if (search) {
        const q = search.toLowerCase()
        if (!a.name?.toLowerCase().includes(q) && !a.phone?.includes(q)) return false
      }
      return true
    })
  }, [appointments, filterStatus, filterDate, search])

  function clearFilters() {
    setSearch('')
    setFilterStatus('')
    setFilterDate('')
  }

  const hasFilters = search || filterStatus || filterDate

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-white">Appointments</h1>
        <p className="text-zinc-500 text-sm mt-0.5">
          {filtered.length} of {appointments.length} records
        </p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <div className="relative flex-1 min-w-48 max-w-xs">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            type="text"
            placeholder="Search name or phone…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-9 pr-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors"
          />
        </div>

        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-zinc-300 focus:outline-none focus:border-zinc-600 transition-colors"
        >
          <option value="">All Status</option>
          <option value="confirmed">Confirmed</option>
          <option value="cancelled">Cancelled</option>
        </select>

        <input
          type="date"
          value={filterDate}
          onChange={e => setFilterDate(e.target.value)}
          className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-zinc-300 focus:outline-none focus:border-zinc-600 transition-colors"
        />

        {hasFilters && (
          <button
            onClick={clearFilters}
            className="text-xs font-mono text-zinc-500 hover:text-white transition-colors px-2 py-2"
          >
            ✕ Clear
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-950">
              {['Patient', 'Phone', 'Service', 'Date', 'Time', 'Duration', 'Status', 'Action'].map(h => (
                <th key={h} className="px-4 py-3 text-left font-mono text-[10px] tracking-widest uppercase text-zinc-600 font-normal">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              [...Array(6)].map((_, i) => (
                <tr key={i} className="border-b border-zinc-800/50">
                  {[...Array(8)].map((_, j) => (
                    <td key={j} className="px-4 py-3.5">
                      <div className="h-4 bg-zinc-800 rounded animate-pulse" style={{ width: `${60 + j * 5}%`, opacity: 0.5 }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-20 text-zinc-600 text-sm">
                  {hasFilters ? 'No appointments match filters' : 'No appointments yet'}
                </td>
              </tr>
            ) : (
              filtered.map((a, i) => (
                <tr
                  key={a.id}
                  className="border-b border-zinc-800/50 hover:bg-zinc-800/40 transition-colors"
                  style={{ animationDelay: `${i * 20}ms` }}
                >
                  <td className="px-4 py-3.5 text-sm font-medium text-white">{a.name || '—'}</td>
                  <td className="px-4 py-3.5 font-mono text-xs text-zinc-400">{a.phone || '—'}</td>
                  <td className="px-4 py-3.5"><ServicePill service={a.service} /></td>
                  <td className="px-4 py-3.5 font-mono text-xs text-zinc-300">
                    {a.date ? format(parseISO(a.date), 'd MMM yyyy') : '—'}
                  </td>
                  <td className="px-4 py-3.5 font-mono text-xs text-zinc-300">{a.time || '—'}</td>
                  <td className="px-4 py-3.5 font-mono text-xs text-zinc-500">{a.duration ? `${a.duration}m` : '—'}</td>
                  <td className="px-4 py-3.5"><StatusBadge status={a.status} /></td>
                  <td className="px-4 py-3.5">
                    {a.status === 'confirmed' ? (
                      <button
                        onClick={() => setCancelTarget(a)}
                        className="text-xs font-mono text-zinc-500 border border-zinc-700 px-3 py-1.5 rounded hover:border-red-400/50 hover:text-red-400 transition-colors"
                      >
                        Cancel
                      </button>
                    ) : (
                      <span className="text-xs font-mono text-zinc-700">—</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Cancel Modal */}
      {cancelTarget && (
        <CancelModal
          appointment={cancelTarget}
          onClose={() => setCancelTarget(null)}
          onConfirm={() => cancelMutation.mutate(cancelTarget.calendar_event_id)}
          loading={cancelMutation.isPending}
        />
      )}

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 px-4 py-3 rounded-lg border font-mono text-xs tracking-wide shadow-xl transition-all ${
          toast.type === 'success'
            ? 'bg-emerald-400/10 border-emerald-400/30 text-emerald-400'
            : 'bg-red-400/10 border-red-400/30 text-red-400'
        }`}>
          {toast.msg}
        </div>
      )}
    </div>
  )
}
