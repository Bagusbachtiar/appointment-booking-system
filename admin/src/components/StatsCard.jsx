const accent = {
  zinc:    'from-zinc-400',
  blue:    'from-blue-400',
  emerald: 'from-emerald-400',
  red:     'from-red-400',
}

const valueColor = {
  zinc:    'text-white',
  blue:    'text-blue-400',
  emerald: 'text-emerald-400',
  red:     'text-red-400',
}

export default function StatsCard({ label, value, color = 'zinc' }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 relative overflow-hidden">
      <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${accent[color]} to-transparent`} />
      <p className="font-mono text-[10px] tracking-widest uppercase text-zinc-500 mb-3">{label}</p>
      <p className={`text-5xl font-bold tabular-nums ${valueColor[color]}`}>
        {value ?? '—'}
      </p>
    </div>
  )
}
