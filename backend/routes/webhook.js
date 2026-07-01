const express = require('express');
const router = express.Router();

const VERIFY_TOKEN = process.env.WEBHOOK_VERIFY_TOKEN || '123456';
const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || 'http://localhost:5678/webhook/whatsapp-appointment';

// GET /webhook — Meta verification challenge
router.get('/', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('[webhook] Meta verification passed');
    return res.status(200).send(challenge);
  }

  console.warn('[webhook] Verification failed — wrong token');
  res.sendStatus(403);
});

// POST /webhook — incoming WhatsApp messages, forward to n8n
router.post('/', async (req, res) => {
  res.sendStatus(200); // ACK Meta immediately (required < 20s)

  try {
    await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });
  } catch (e) {
    console.error('[webhook] Forward to n8n failed:', e.message);
  }
});

module.exports = router;
