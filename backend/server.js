require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initDb } = require('./db');
const calendarRoutes = require('./routes/calendar');
const appointmentRoutes = require('./routes/appointments');
const webhookRoutes = require('./routes/webhook');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use((req, res, next) => { res.on('finish', () => console.log(`${req.method} ${req.path} ${res.statusCode}`)); next(); });

app.use('/api/calendar', calendarRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/webhook', webhookRoutes);

app.get('/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

initDb();
app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
  console.log('Endpoints:');
  console.log('  GET  /api/calendar/availability?date=YYYY-MM-DD&service=Cleaning');
  console.log('  POST /api/calendar/events');
  console.log('  DEL  /api/calendar/events/:eventId');
  console.log('  GET  /api/appointments/by-phone/:phone');
  console.log('  GET  /api/appointments');
});
