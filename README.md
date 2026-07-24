# Appointment Booking System

Multi-channel AI appointment booking for dental clinics. Two independent front-ends — WhatsApp chatbot and AI phone receptionist — share a single Node.js booking backend that handles all calendar logic.

**Channels:**
- WhatsApp chatbot (text + voice messages via n8n + GPT-4o-mini + Groq Whisper)
- Voice AI phone receptionist (Retell AI + Twilio) — see [`voice-ai/`](./voice-ai/)

## Demo

> Voice booking · Text booking · List · Cancel · Slot selection · Reschedule · Auto reminder · Phone call booking

WhatsApp demo: https://www.linkedin.com/feed/update/urn:li:activity:7481681007134306304/
Voice AI demo: https://www.linkedin.com/feed/update/urn:li:ugcPost:7486297823966179328/

## Features

### WhatsApp Channel
- **Voice Message Booking** — send a voice note, Groq Whisper transcribes it, processed through the same n8n pipeline as text
- **Text Auto-Book** — specify time in your message, booked instantly without slot selection
- **List Appointments** — ask the bot, get all upcoming confirmed bookings
- **Cancel** — bot asks confirmation first, then removes event from Google Calendar
- **Slot Selection** — no time specified? bot checks availability and offers 3 options
- **Reschedule** — old calendar event deleted, new one created atomically
- **Automatic Reminders** — WhatsApp message sent 24h and 2h before appointment

### Voice AI Channel
- **Phone Call Booking** — call a real US phone number, AI receptionist answers and books via live voice conversation
- **Real-time turn-taking** — Retell AI handles speech-to-text, LLM response, and text-to-speech in-call
- **Same booking engine** — phone calls hit the same backend as WhatsApp, no duplicate logic

---

## Shared Backend

Both channels call the same Node.js + Express booking engine. It owns all create / read / update / cancel / reschedule logic and talks directly to Google Calendar and SQLite. Neither front-end duplicates this logic — they just POST to it.

**Stack:**

| Layer | Technology |
|---|---|
| API server | Node.js + Express |
| Database | SQLite (better-sqlite3) |
| Calendar | Google Calendar API |
| Session / dedup | Redis |

---

## WhatsApp Channel

Patient sends a WhatsApp message (text or voice note) → n8n workflow processes it → GPT-4o-mini detects intent → backend called → reply sent back via WhatsApp.

Voice notes take one extra step: Groq Whisper transcribes the audio first, then the transcript enters the same pipeline as a typed message.

**Stack:**

| Layer | Technology |
|---|---|
| Chat interface | WhatsApp Cloud API (Meta) |
| Workflow engine | n8n (self-hosted) |
| Intent detection | GPT-4o-mini |
| Voice transcription | Groq API — whisper-large-v3-turbo |
| Tunnel (dev) | ngrok |

**Pipeline:**

```
Patient WhatsApp → Meta Cloud API → ngrok → Express webhook proxy
→ n8n workflow → GPT-4o-mini (intent detection)
             ↳ Groq Whisper (voice notes only — transcribe then re-enter pipeline)
→ Node.js backend → Google Calendar
→ Meta Cloud API → Patient WhatsApp (reply)
```

**Workflow files:** `workflow.json` (42-node booking workflow), `reminder_workflow.json` (runs every 30 min)

---

## Voice AI Channel

Caller dials a real Twilio phone number → Twilio routes via SIP trunk to Retell AI → Retell agent (Maya) handles the live conversation → when caller wants to book or check availability, Retell calls a custom function that POSTs to the shared backend.

WhatsApp, n8n, Ollama, and Groq Whisper play no role here. Retell handles its own speech-to-text, LLM, and text-to-speech in-call.

**Stack:**

| Layer | Technology |
|---|---|
| Telephony | Twilio (Elastic SIP Trunking) |
| Voice AI | Retell AI (Single Prompt agent) |
| Tunnel (dev) | ngrok |

**Pipeline:**

```
Caller → Twilio US number → SIP trunk → Retell AI agent (Maya)
                                              ↓
                                   check_availability (POST)
                                   book_appointment (POST)
                                              ↓
                                     Node.js backend → Google Calendar
```

See [`voice-ai/README.md`](./voice-ai/README.md) for full Retell + Twilio setup.

---

## Project Structure

```
appointment-booking-system/
├── backend/
│   ├── server.js           # Express entry point
│   ├── db.js               # SQLite setup
│   ├── calendar.js         # Google Calendar client
│   └── routes/
│       ├── appointments.js # Appointment CRUD + reschedule endpoint
│       ├── calendar.js     # Availability + event creation (used by both channels)
│       └── webhook.js      # Meta webhook proxy → n8n
├── voice-ai/
│   └── README.md           # Voice AI setup (Retell + Twilio)
├── workflow.json           # n8n main booking workflow (42 nodes)
├── reminder_workflow.json  # n8n reminder workflow (runs every 30 min)
└── admin/                  # Admin dashboard (Vite)
```

---

## Setup

### Prerequisites
- Node.js 18+
- Docker (for Redis and n8n)
- ngrok account (static domain)
- Meta WhatsApp Business API access
- Google Cloud project with Calendar API enabled
- Groq API key (WhatsApp channel only)
- Retell AI account + Twilio account (Voice AI channel only)

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

For Voice AI channel setup, see [`voice-ai/README.md`](./voice-ai/README.md).

## License

MIT
