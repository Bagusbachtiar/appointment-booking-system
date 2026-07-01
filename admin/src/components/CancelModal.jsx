import { format, parseISO } from 'date-fns'

export default function CancelModal({ appointment, onConfirm, onClose, loading }) {
  if (!appointment) return null

  const dateLabel = appointment.date
    ? format(parseISO(appointment.date), 'd MMM yyyy')
    : appointment.date

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 w-full max-w-sm shadow-2xl">
        <div className="w-10 h-10 rounded-full bg-red-400/10 border border-red-400/20 flex items-center justify-center mb-4">
          <span className="text-red-400 text-lg">✕</span>
        </div>
        <h2 className="text-lg font-semibold text-white mb-2">Cancel Appointment</h2>
        <p className="text-sm text-zinc-400 mb-6 leading-relaxed">
          Cancel <span className="text-white font-medium">{appointment.name}</span>'s{' '}
          <span className="text-white font-medium">{appointment.service}</span> on{' '}
          <span className="text-white font-medium">{dateLabel}</span> at{' '}
          <span className="text-white font-medium">{appointment.time}</span>?{' '}
          This removes the Google Calendar event.
        </p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-zinc-400 border border-zinc-700 rounded-lg hover:border-zinc-500 hover:text-white transition-colors"
          >
            Keep it
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="px-4 py-2 text-sm bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Cancelling…' : 'Yes, cancel'}
          </button>
        </div>
      </div>
    </div>
  )
}
