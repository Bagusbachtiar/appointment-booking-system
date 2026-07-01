const config = {
  'Cleaning':     'bg-blue-400/10 text-blue-400 border-blue-400/20',
  'First Visit':  'bg-emerald-400/10 text-emerald-400 border-emerald-400/20',
  'Emergency':    'bg-amber-400/10 text-amber-400 border-amber-400/20',
}

export default function ServicePill({ service }) {
  const cls = config[service] || 'bg-zinc-800 text-zinc-400 border-zinc-700'
  return (
    <span className={`inline-block px-2 py-0.5 rounded border font-mono text-[10px] tracking-widest uppercase ${cls}`}>
      {service || '—'}
    </span>
  )
}
