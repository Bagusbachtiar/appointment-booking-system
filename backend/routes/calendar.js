require('dotenv').config();
const express = require('express');
const router = express.Router();
const { getCalendar } = require('../calendar');
const { getDb } = require('../db');

const CALENDAR_ID = process.env.CALENDAR_ID || 'primary';
const TIMEZONE = process.env.TIMEZONE || 'Asia/Jakarta';

const SERVICE_DURATIONS = {
  'Cleaning': 30,
  'First Visit': 60,
  'Emergency': 30
};

const BUSINESS_START = 0;
const BUSINESS_END = 24;

// GET /api/calendar/availability?date=YYYY-MM-DD&service=Cleaning
router.get('/availability', async (req, res) => {
  try {
    const { date, service } = req.query;
    if (!date) return res.status(400).json({ error: 'date required' });

    const duration = SERVICE_DURATIONS[service] || 30;

    const calendar = getCalendar();
    const timeMin = new Date(date + 'T00:00:00').toISOString();
    const timeMax = new Date(date + 'T23:59:59').toISOString();

    const eventsRes = await calendar.events.list({
      calendarId: CALENDAR_ID,
      timeMin,
      timeMax,
      singleEvents: true,
      orderBy: 'startTime'
    });

    const events = eventsRes.data.items || [];

    // Build busy blocks (in minutes from midnight)
    const busyBlocks = events
      .filter(e => e.start?.dateTime)
      .map(e => {
        const start = new Date(e.start.dateTime);
        const end = new Date(e.end.dateTime);
        return {
          start: start.getHours() * 60 + start.getMinutes(),
          end: end.getHours() * 60 + end.getMinutes()
        };
      });

    // Generate all possible slots
    const slots = [];
    for (let startMin = BUSINESS_START * 60; startMin + duration <= BUSINESS_END * 60; startMin += 30) {
      const endMin = startMin + duration;
      const conflict = busyBlocks.some(b => startMin < b.end && endMin > b.start);
      if (!conflict) {
        const h = Math.floor(startMin / 60);
        const m = startMin % 60;
        slots.push({
          time: `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`,
          duration
        });
      }
    }

    res.json({ slots, date, service, duration });
  } catch (e) {
    console.error('[availability]', e.message);
    res.status(500).json({ error: e.message });
  }
});

// POST /api/calendar/events
router.post('/events', async (req, res) => {
  try {
    const { service, date, time, duration, name, phone, notes } = req.body;
    if (!service || !date || !time || !name || !phone) {
      return res.status(400).json({ error: 'Missing required fields: service, date, time, name, phone' });
    }

    const dur = duration || SERVICE_DURATIONS[service] || 30;
    const startDt = new Date(`${date}T${time}:00`);
    const endDt = new Date(startDt.getTime() + dur * 60000);

    const calendar = getCalendar();
    const event = await calendar.events.insert({
      calendarId: CALENDAR_ID,
      resource: {
        summary: `${service} - ${name}`,
        description: `Patient: ${name}\nPhone: ${phone}${notes ? '\nNotes: ' + notes : ''}`,
        start: { dateTime: startDt.toISOString(), timeZone: TIMEZONE },
        end: { dateTime: endDt.toISOString(), timeZone: TIMEZONE },
        colorId: '1',
        extendedProperties: { private: { phone, service } }
      }
    });

    const db = getDb();
    const result = db.prepare(`
      INSERT INTO appointments (phone, name, service, date, time, duration, calendar_event_id, status, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'confirmed', ?)
    `).run(phone, name, service, date, time, dur, event.data.id, notes || null);

    res.json({
      id: result.lastInsertRowid,
      eventId: event.data.id,
      service, date, time, name, phone
    });
  } catch (e) {
    console.error('[create event]', e.message);
    res.status(500).json({ error: e.message });
  }
});

// DELETE /api/calendar/events/:eventId
router.delete('/events/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;
    const calendar = getCalendar();

    await calendar.events.delete({ calendarId: CALENDAR_ID, eventId });

    const db = getDb();
    db.prepare(`
      UPDATE appointments
      SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
      WHERE calendar_event_id = ?
    `).run(eventId);

    res.json({ success: true, eventId });
  } catch (e) {
    console.error('[delete event]', e.message);
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
