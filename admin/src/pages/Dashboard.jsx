import { useQuery } from '@tanstack/react-query'
import { format, subDays, parseISO } from 'date-fns'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { fetchAppointments } from '../api/appointments'
import StatsCard from '../components/StatsCard'
import StatusBadge from '../components/StatusBadge'
import ServicePill from '../components/ServicePill'

export default function Dashboard() {
  const { data: appointments = [], isLoading, refetch } = useQuery({
    queryKey: ['appointments'],
    queryFn: () => fetchAppointments(),
    refetchInterval: 60000,
  })

  const today = format(new Date(), 'yyyy-MM-dd')

  const stats = {
    total:     appointments.length,
    today:     appointments.filter(a => a.date === today).length,
    confirmed: appointments.filter(a => a.status === 'confirmed').length,
    cancelled: appointments.filter(a => a.status === 'cancelled').length,
  }

  const chartData = Array.from({ length: 7 }, (_, i) => {
    const d = subDays(new Date(), 6 - i)
    const ds = format(d, 'yyyy-MM-dd')
    return {
      day: format(d, 'EEE'),
      total: appointments.filter(a => a.date === ds).length,
      confirmed: appointments.filter(a => a.date === ds && a.status === 'confirmed').length,
    }
  })

  const recent = [...appointments]
    .sort((a, b) => b.id - a.id)
    .slice(0, 8)

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-semibold text-white">Dashboard</h1>
          <p className="text-zinc-500 text-sm mt-0.5 font-mono">
            {format(new Date(), 'EEEE, d MMMM yyyy')}
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 px-3 py-2 text-xs font-mono text-zinc-400 border border-zinc-800 rounded-lg hover:border-zinc-600 hover:text-white transition-colors"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
            <path d="M21 3v5h-5"/>
            <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
            <path d="M8 16H3v5"/>
          </svg>
          REFRESH
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatsCard label="Total" value={stats.total} color="zinc" />
        <StatsCard label="Today" value={stats.today} color="blue" />
        <StatsCard label="Confirmed" value={stats.confirmed} color="emerald" />
        <StatsCard label="Cancelled" value={stats.cancelled} color="red" />
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Chart */}
        <div className="col-span-2 bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <p className="font-mono text-[10px] tracking-widest uppercase text-zinc-500 mb-6">
            Appointments — Last 7 Days
          </p>
          {isLoading ? (
            <div className="h-52 bg-zinc-800 rounded-lg animate-pulse" />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData} barCategoryGap="35%" barGap={2}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis
                  dataKey="day"
                  tick={{ fill: '#71717a', fontSize: 11, fontFamily: 'JetBrains Mono' }}
                  axisLine={false} tickLine={false}
                />
                <YAxis
                  tick={{ fill: '#71717a', fontSize: 11, fontFamily: 'JetBrains Mono' }}
                  axisLine={false} tickLine={false}
                  allowDecimals={false}
                  width={24}
                />
                <Tooltip
                  contentStyle={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '8px', fontSize: '12px', fontFamily: 'JetBrains Mono' }}
                  labelStyle={{ color: '#a1a1aa', marginBottom: '4px' }}
                  cursor={{ fill: '#27272a55' }}
                />
                <Bar dataKey="confirmed" name="Confirmed" fill="#34d399" radius={[3, 3, 0, 0]} />
                <Bar dataKey="total" name="Total" fill="#3f3f46" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Recent */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <p className="font-mono text-[10px] tracking-widest uppercase text-zinc-500 mb-4">
            Recent Appointments
          </p>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-11 bg-zinc-800 rounded-lg animate-pulse" style={{ opacity: 1 - i * 0.12 }} />
              ))}
            </div>
          ) : recent.length === 0 ? (
            <p className="text-zinc-600 text-sm text-center py-12">No appointments yet</p>
          ) : (
            <div className="divide-y divide-zinc-800">
              {recent.map(a => (
                <div key={a.id} className="flex items-center justify-between py-2.5">
                  <div className="min-w-0 mr-2">
                    <p className="text-sm font-medium text-white truncate">{a.name}</p>
                    <p className="font-mono text-[10px] text-zinc-500 mt-0.5">
                      {a.date} · {a.time}
                    </p>
                  </div>
                  <StatusBadge status={a.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Service breakdown */}
      <div className="mt-6 bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <p className="font-mono text-[10px] tracking-widest uppercase text-zinc-500 mb-4">
          Service Breakdown
        </p>
        <div className="grid grid-cols-3 gap-4">
          {['Cleaning', 'First Visit', 'Emergency'].map(svc => {
            const count = appointments.filter(a => a.service === svc).length
            const pct = appointments.length ? Math.round(count / appointments.length * 100) : 0
            return (
              <div key={svc} className="bg-zinc-950 border border-zinc-800 rounded-lg p-4">
                <ServicePill service={svc} />
                <p className="text-3xl font-bold text-white mt-3 mb-1">{count}</p>
                <div className="h-1 bg-zinc-800 rounded-full mt-2">
                  <div
                    className="h-1 bg-emerald-400 rounded-full transition-all duration-700"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className="font-mono text-[10px] text-zinc-600 mt-1">{pct}% of total</p>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
