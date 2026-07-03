const express = require('express');
const router = express.Router();
const { getDb } = require('../db');

// GET /api/appointments/by-phone/:phone
router.get('/by-phone/:phone', (req, res) => {
  try {
    const { phone } = req.params;
    const db = getDb();
    const appt = db.prepare(`
      SELECT * FROM appointments
      WHERE phone = ? AND status = 'confirmed'
      ORDER BY date ASC, time ASC
      LIMIT 1
    `).get(phone);

    if (!appt) return res.json(null);

    res.json({
      id: appt.id,
      phone: appt.phone,
      name: appt.name,
      service: appt.service,
      date: appt.date,
      time: appt.time,
      duration: appt.duration,
      calendarEventId: appt.calendar_event_id,
      status: appt.status,
      notes: appt.notes
    });
  } catch (e) {
    console.error('[by-phone]', e.message);
    res.status(500).json({ error: e.message });
  }
});

// GET /api/appointments — admin dashboard data
router.get('/', (req, res) => {
  try {
    const { status, date } = req.query;
    const db = getDb();

    let query = 'SELECT * FROM appointments WHERE 1=1';
    const params = [];

    if (status) { query += ' AND status = ?'; params.push(status); }
    if (date) { query += ' AND date = ?'; params.push(date); }

    query += ' ORDER BY date DESC, time DESC LIMIT 200';

    const appts = db.prepare(query).all(...params);
    res.json(appts);
  } catch (e) {
    console.error('[appointments list]', e.message);
    res.status(500).json({ error: e.message });
  }
});

// GET /api/appointments/pending-reminders
// Returns appointments needing 24h or 2h reminder (not yet sent)
router.get('/pending-reminders', (req, res) => {
  try {
    const db = getDb();
    const tz_offset = parseInt(process.env.TZ_OFFSET || '7'); // UTC+7 Jakarta
    const nowUtc = Date.now();
    const nowLocal = new Date(nowUtc + tz_offset * 3600000);

    const reminders = [];
    const appts = db.prepare(`
      SELECT * FROM appointments
      WHERE status = 'confirmed'
      AND date >= date('now', '-1 day')
    `).all();

    for (const appt of appts) {
      const apptMs = new Date(`${appt.date}T${appt.time}:00+0${tz_offset}:00`).getTime();
      const diffMs = apptMs - nowUtc;
      const diffHr = diffMs / 3600000;

      if (diffHr >= 23 && diffHr <= 25 && !appt.reminder_24h_sent) {
        reminders.push({ ...appt, reminderType: '24h' });
      } else if (diffHr >= 1 && diffHr <= 3 && !appt.reminder_2h_sent) {
        reminders.push({ ...appt, reminderType: '2h' });
      }
    }

    res.json(reminders);
  } catch (e) {
    console.error('[pending-reminders]', e.message);
    res.status(500).json({ error: e.message });
  }
});

// POST /api/appointments/:id/mark-reminder
router.post('/:id/mark-reminder', (req, res) => {
  try {
    const { id } = req.params;
    const { reminderType } = req.body;
    const db = getDb();

    const col = reminderType === '24h' ? 'reminder_24h_sent' : 'reminder_2h_sent';
    db.prepare(`UPDATE appointments SET ${col} = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(id);

    res.json({ success: true, id, reminderType });
  } catch (e) {
    console.error('[mark-reminder]', e.message);
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
