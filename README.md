# WhatsApp Appointment Booking System

A WhatsApp chatbot for dental clinic appointment management. Patients book, reschedule, cancel, and receive automatic reminders — all through WhatsApp chat, no app or form required.

## Demo

> Voice booking · Text booking · List · Cancel · Slot selection · Reschedule · Auto reminder

## Features

- **Voice Message Booking** — send a voice note, Groq Whisper transcribes it, AI extracts intent and books automatically
- **Text Auto-Book** — specify time in your message, booked instantly without slot selection
- **List Appointments** — ask the bot, get all upcoming confirmed bookings
- **Cancel** — bot asks confirmation first, then removes event from Google Calendar
- **Slot Selection** — no time specified? bot checks availability and offers 3 options
- **Reschedule** — old calendar event deleted, new one created atomically
- **Automatic Reminders** — WhatsApp message sent 24h and 2h before appointment, no manual trigger

## Stack

| Layer | Technology |
|---|---|
| Chat interface | WhatsApp Cloud API (Meta) |
| Workflow engine | n8n (self-hosted) |
| Intent detection | Ollama + llama3 (local LLM) |
| Voice transcription | Groq API — whisper-large-v3-turbo |
| Calendar | Google Calendar API |
| Backend | Node.js + Express |
| Database | SQLite (better-sqlite3) |
| Session / dedup | Redis |
| Tunnel | ngrok |

## Architecture

```
Patient WhatsApp → Meta Cloud API → ngrok → Express webhook proxy
→ n8n workflow → Ollama llama3 (intent detection)
             → Groq Whisper (voice transcription)
→ Google Calendar (availability check / event create/delete)
→ SQLite (appointment record)
→ Meta Cloud API → Patient WhatsApp (reply)
```

## Project Structure

```
appointment-booking-system/
├── backend/
│   ├── server.js           # Express entry point
│   ├── db.js               # SQLite setup
│   ├── calendar.js         # Google Calendar client
│   └── routes/
│       ├── appointments.js # Appointment CRUD + reschedule endpoint
│       ├── calendar.js     # Availability + event creation
│       └── webhook.js      # Meta webhook proxy → n8n
├── workflow.json           # n8n main booking workflow (42 nodes)
├── reminder_workflow.json  # n8n reminder workflow (runs every 30 min)
└── admin/                  # Admin dashboard (Vite)
```

## Setup

### Prerequisites
- Node.js 18+
- Docker (for Redis and n8n)
- ngrok account (static domain)
- Meta WhatsApp Business API access
- Google Cloud project with Calendar API enabled
- Groq API key
- Ollama running locally with llama3

### Environment Variables

Create `backend/.env`:

```env
PORT=3000
DB_PATH=./appointments.db
CALENDAR_ID=your_google_calendar_id
TIMEZONE=Asia/Jakarta
TZ_OFFSET=7
WEBHOOK_VERIFY_TOKEN=your_verify_token
N8N_WEBHOOK_URL=http://localhost:5678/webhook/whatsapp-appointment
N8N_API_KEY=your_n8n_api_key
WHATSAPP_TOKEN=your_meta_access_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
```

### Run

```bash
# Start Redis
docker run -d --name redis -p 6379:6379 redis

# Start n8n
docker run -d --name n8n -p 5678:5678 n8nio/n8n

# Start backend
cd backend && npm install && node server.js

# Start ngrok
ngrok http --domain=your-static-domain.ngrok-free.app 3000
```

Import `workflow.json` and `reminder_workflow.json` into n8n, configure credentials, and activate both workflows.

## License

MIT
