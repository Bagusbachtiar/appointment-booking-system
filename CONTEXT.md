# Appointment Booking System — Project Context

## Purpose
Portfolio project for Upwork. Goal: demo-ready appointment booking automation that can be shown to clients in clinics, salons, restaurants, real estate, and similar service businesses.

## Why This Project
Multiple Upwork jobs paying $400–1,500 require appointment booking automation. Developer has a WhatsApp AI catering bot already built — this project extends that foundation with Google Calendar, reschedule/cancel flows, and a reusable multi-business architecture.

## Developer's Existing Stack
- n8n (workflow automation) — primary tool, already proficient
- Meta WhatsApp Cloud API — already integrated in catering bot
- Node.js + Express + SQLite — dashboard backend
- Redis — session/conversation state
- Local LLM via Ollama (Qwen3:8b for extraction, Llama3 for chat)
- Reference project: https://github.com/Bagusbachtiar/catering_automation

## What to Build

### Core Features (MVP)
1. **WhatsApp intake** — receive messages via Meta Cloud API webhook (n8n)
2. **AI intent detection** — classify message as: booking / reschedule / cancel / confirmation / unclear
3. **Structured data extraction** — extract: service, date, time, name, phone, notes
4. **Google Calendar integration** — check availability, create/update/delete events
5. **Clarification loop** — ask one question if data is missing
6. **Confirmation flow** — send itemized summary, wait for "1" or 👍
7. **Reschedule flow** — find existing appointment, propose new slots, update calendar
8. **Cancel flow** — confirm intent, delete/mark cancelled in calendar
9. **Appointment reminders** — 24hr + 2hr before (n8n scheduled trigger)
10. **SQLite or Supabase DB** — store contacts, appointments, logs
11. **Simple admin dashboard** — view bookings, statuses (Confirmed / Pending / Cancelled)
12. **Human escalation** — route to human when AI confidence low or user requests it

### Configurable Business Catalog
Each business type has its own service catalog in DB:
- Service name, duration, assigned staff, calendar ID, buffer time, booking rules

Demo should work for at least 2 business types (e.g. dental clinic + hair salon).

## Recommended Stack
| Layer | Tech |
|---|---|
| Workflow | n8n (self-hosted, already running) |
| WhatsApp | Meta WhatsApp Cloud API |
| AI/LLM | Ollama local LLM (Qwen3:8b for extraction, Llama3 for chat) |
| Calendar | Google Calendar API |
| Database | SQLite (dev) or Supabase (prod) |
| Backend | Node.js + Express |
| Dashboard | Simple HTML/CSS/JS (same pattern as catering bot) |
| Reminders | n8n scheduled trigger nodes |

> Note: Use local Ollama (Qwen3:8b / Llama3) — demo is a recorded video only, not hosted. No cloud LLM cost needed.

## Key Architecture
```
WhatsApp message
      ↓
n8n webhook (Meta Cloud API)
      ↓
Parse + detect message type (text)
      ↓
AI intent detection + data extraction (Ollama local LLM)
      ↓
Route: booking / reschedule / cancel / unclear
      ↓
[Booking flow]
  → check Google Calendar availability
  → propose 3 slots
  → wait for selection
  → re-check availability
  → create calendar event
  → save to DB
  → send WhatsApp confirmation
      ↓
[Reschedule flow]
  → find existing appointment (by phone number)
  → propose new slots
  → update calendar event
  → send confirmation
      ↓
[Cancel flow]
  → find appointment
  → confirm with user
  → delete/mark cancelled
  → send confirmation
      ↓
[Reminder flow — scheduled]
  → query DB for appointments in next 24hr / 2hr
  → send WhatsApp reminder
  → handle reply (confirm / cancel / reschedule)
```

## What NOT to Build (v1)
- No payment processing
- No voice notes (add later for Retell AI/Vapi portfolio extension)
- No multi-language (English only)
- No complex CRM (SQLite is fine)
- No mobile app

## Demo Scenario
Build demo for: **Dental Clinic**
- Services: Cleaning (30min), First Visit (60min), Emergency (30min)
- One dentist, Mon-Fri 9am-5pm
- Show full flow: book → reminder → reschedule → cancel

> **Demo = recorded video only.** Not hosted, not deployed. Runs locally on dev machine during recording. No cloud costs.

## Success Criteria
- End-to-end WhatsApp conversation works
- Google Calendar events created/updated/deleted correctly
- No double bookings
- Reminders send automatically
- Admin dashboard shows bookings
- Recorded demo video for Upwork portfolio

## Upwork Jobs This Covers
- "AI Automation Specialist for Appointment System" ($400-500)
- "No-Code AI Automation Developer — WhatsApp, n8n" ($1,500)
- "Voice AI Appointment Booking" (add Retell AI later)
- Any WhatsApp + calendar + CRM automation job

## n8n Access (for testing)
- n8n URL: http://127.0.0.1:5678
- API Key: generate via n8n Settings → API → Create API Key
- Header: `X-N8N-API-KEY: <your key>`
- Existing catering workflow ID: Tr9Un9VdcjTXyPV7 (reference only, do not modify)

## Start Here
1. Set up Google Cloud project + enable Calendar API + get OAuth credentials
2. Create n8n workflow skeleton: webhook → parse → intent detection node
3. Build booking flow first (most common path)
4. Add reschedule + cancel
5. Add reminders (scheduled trigger)
6. Build admin dashboard
7. Record demo video
