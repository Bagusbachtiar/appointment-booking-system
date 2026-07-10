const fs = require('fs');

const PHONE_NUMBER_ID = '1126606553859192';
const BACKEND = 'http://host.docker.internal:3000';

const workflow = {
  name: 'WhatsApp Appointment Reminders',
  nodes: [
    {
      id: 'rem-001',
      name: 'Schedule Trigger',
      type: 'n8n-nodes-base.scheduleTrigger',
      typeVersion: 1.2,
      position: [240, 300],
      parameters: {
        rule: {
          interval: [{ field: 'minutes', minutesInterval: 30 }]
        }
      }
    },
    {
      id: 'rem-002',
      name: 'Fetch Pending Reminders',
      type: 'n8n-nodes-base.httpRequest',
      typeVersion: 4.2,
      position: [460, 300],
      parameters: {
        url: `${BACKEND}/api/appointments/pending-reminders`,
        options: {}
      }
    },
    {
      id: 'rem-003',
      name: 'Split and Format',
      type: 'n8n-nodes-base.code',
      typeVersion: 2,
      position: [680, 300],
      parameters: {
        jsCode: `const data = $input.first().json;
const reminders = Array.isArray(data) ? data : [];
if (reminders.length === 0) return [];

return reminders.map(function(appt) {
  let msg = '';
  if (appt.reminderType === '24h') {
    msg = '🦷 *Appointment Reminder*\\n\\nHi ' + (appt.name || 'there') + '! Just a reminder that you have an appointment tomorrow:\\n\\n' +
          '*Service:* ' + appt.service + '\\n' +
          '*Date:* ' + appt.date + '\\n' +
          '*Time:* ' + appt.time + '\\n\\n' +
          'Please reply if you need to reschedule or cancel. See you tomorrow! 😊';
  } else {
    msg = '🦷 *Appointment Reminder*\\n\\nHi ' + (appt.name || 'there') + '! Your appointment is in about 2 hours:\\n\\n' +
          '*Service:* ' + appt.service + '\\n' +
          '*Time:* ' + appt.time + '\\n\\n' +
          'We look forward to seeing you soon! 😊';
  }
  return { json: { ...appt, reminderText: msg } };
});`
      }
    },
    {
      id: 'rem-006',
      name: 'Send Reminder WhatsApp',
      type: 'n8n-nodes-base.httpRequest',
      typeVersion: 4.4,
      position: [900, 300],
      parameters: {
        method: 'POST',
        url: `https://graph.facebook.com/v19.0/${PHONE_NUMBER_ID}/messages`,
        authentication: 'genericCredentialType',
        genericAuthType: 'httpHeaderAuth',
        sendBody: true,
        contentType: 'raw',
        rawContentType: 'application/json',
        body: '={{ JSON.stringify({ messaging_product: \'whatsapp\', to: $json.phone, type: \'text\', text: { body: $json.reminderText } }) }}',
        options: {}
      },
      credentials: {
        httpHeaderAuth: {
          id: 'pcFpAYQlwDZ3PiNX',
          name: 'Header Auth account'
        }
      }
    },
    {
      id: 'rem-007',
      name: 'Mark Reminder Sent',
      type: 'n8n-nodes-base.httpRequest',
      typeVersion: 4.2,
      position: [1120, 300],
      parameters: {
        method: 'POST',
        url: `={{ '${BACKEND}/api/appointments/' + $json.id + '/mark-reminder' }}`,
        sendBody: true,
        contentType: 'json',
        body: { reminderType: '={{ $json.reminderType }}' },
        options: {}
      }
    }
  ],
  connections: {
    'Schedule Trigger': {
      main: [[{ node: 'Fetch Pending Reminders', type: 'main', index: 0 }]]
    },
    'Fetch Pending Reminders': {
      main: [[{ node: 'Split and Format', type: 'main', index: 0 }]]
    },
    'Split and Format': {
      main: [[{ node: 'Send Reminder WhatsApp', type: 'main', index: 0 }]]
    },
    'Send Reminder WhatsApp': {
      main: [[{ node: 'Mark Reminder Sent', type: 'main', index: 0 }]]
    }
  },
  settings: { executionOrder: 'v1' },
  staticData: null
};

fs.writeFileSync('reminder_workflow.json', JSON.stringify(workflow, null, 2));
console.log('built:', workflow.nodes.length, 'nodes');
