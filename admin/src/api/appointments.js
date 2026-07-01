export async function fetchAppointments(filters = {}) {
  const params = new URLSearchParams()
  if (filters.status) params.set('status', filters.status)
  if (filters.date) params.set('date', filters.date)
  const res = await fetch(`/api/appointments?${params}`)
  if (!res.ok) throw new Error('Failed to fetch appointments')
  return res.json()
}

export async function cancelAppointment(calendarEventId) {
  const res = await fetch(`/api/calendar/events/${calendarEventId}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Failed to cancel appointment')
  return res.json()
}

export async function checkAvailability(date, service) {
  const res = await fetch(`/api/calendar/availability?date=${date}&service=${encodeURIComponent(service)}`)
  if (!res.ok) throw new Error('Failed to fetch availability')
  return res.json()
}
