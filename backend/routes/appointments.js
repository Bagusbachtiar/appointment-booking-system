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

module.exports = router;
