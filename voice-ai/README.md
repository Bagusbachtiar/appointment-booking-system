# Voice AI Receptionist

AI phone receptionist extension for this booking system. Handles inbound calls, checks availability, and books appointments on Google Calendar — no human needed.

## Demo

Caller dials a real US phone number → AI receptionist (Maya) answers → books a dental appointment via voice conversation.

## Stack

| Layer | Technology |
|---|---|
| Telephony | Twilio (Elastic SIP Trunking) |
| Voice AI | Retell AI (Single Prompt agent) |
| Booking backend | This repo's Node.js + Express API |
| Tunnel (dev) | ngrok |

## Architecture

```
Caller → Twilio US number → SIP trunk → Retell AI agent (Maya)
                                              ↓
                                   check_availability (POST)
                                   book_appointment (POST)
                                              ↓
                               Node.js backend → Google Calendar
```

## Agent Behavior

Maya handles:
- Greeting and service selection (Cleaning / First Visit / Emergency)
- Date validation (Mon–Fri only)
- Availability check via custom function call
- Booking confirmation with name + phone collection
- Hardcoded Q&A (hours, pricing, services)

## Backend Endpoints Used

### check_availability
```
POST /api/calendar/availability
Body: { date: "YYYY-MM-DD", service: "Cleaning" }
```

### book_appointment
```
POST /api/calendar/events
Body: { service, date, time, name, phone }
```

## Setup

### 1. Start backend + expose publicly
```bash
cd backend && node server.js
ngrok http 3000
```

### 2. Twilio — Create Elastic SIP Trunk
- Origination URI: `sip:sip.retellai.com`
- Create a credential list (username + password)
- Assign your Twilio number to the trunk

### 3. Retell — Create Single Prompt Agent
- Add `check_availability` custom function:
  - Method: POST
  - URL: `https://your-ngrok-url/api/calendar/availability`
  - Parameters: `date` (string, required), `service` (string, required)
  - Payload: args only ON
- Add `book_appointment` custom function:
  - Method: POST
  - URL: `https://your-ngrok-url/api/calendar/events`
  - Parameters: `service`, `date`, `time`, `name`, `phone` (all string, required)
  - Payload: args only ON

### 4. Retell — Import Phone Number
- Phone Number: your Twilio number (E.164)
- Termination URI: `your-trunk.pstn.twilio.com`
- SIP credentials: from Step 2

### 5. Assign agent to phone number in Retell dashboard

## Key Notes

- Retell sends LLM function args under `req.body.args` — backend reads from there
- Use POST for all Retell custom functions — GET query params are not dynamically populated
- Google OAuth tokens expire every 7 days in test mode — re-run `node auth.js` to refresh
