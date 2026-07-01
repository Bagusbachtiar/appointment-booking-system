const config = {
  confirmed: {
    dot: 'bg-emerald-400 shadow-[0_0_4px_#34d399] animate-pulse',
    text: 'text-emerald-400',
    bg: 'bg-emerald-400/10 border-emerald-400/20',
  },
  cancelled: {
    dot: 'bg-red-400',
    text: 'text-red-400',
    bg: 'bg-red-400/10 border-red-400/20',
  },
}

export default function StatusBadge({ status }) {
  const c = config[status] || { dot: 'bg-zinc-500', text: 'text-zinc-400', bg: 'bg-zinc-800 border-zinc-700' }
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded border font-mono text-[10px] tracking-widest uppercase ${c.bg} ${c.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {status || '—'}
    </span>
  )
}
