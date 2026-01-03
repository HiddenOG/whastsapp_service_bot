// Import Express.js
const express = require('express');

// Create an Express app
const app = express();

// Middleware to parse JSON bodies
app.use(express.json());

// Set port and verify_token
const port = process.env.PORT || 3000;
const verifyToken = process.env.VERIFY_TOKEN;

// Route for GET requests
app.get('/', (req, res) => {
  const { 'hub.mode': mode, 'hub.challenge': challenge, 'hub.verify_token': token } = req.query;

  if (mode === 'subscribe' && token === verifyToken) {
    console.log('WEBHOOK VERIFIED');
    res.status(200).send(challenge);
  } else {
    res.status(403).end();
  }
});

// Route for POST requests
app.post('/', async (req, res) => {
  const data = req.body;
  console.log('📩 Webhook received:', JSON.stringify(data, null, 2));

  try {
    const entry = data.entry[0];
    const change = entry.changes[0].value;

    if (!change.messages) {
      return res.sendStatus(200); // ignore non-message events
    }

    const message = change.messages[0];
    const sender = message.from;
    const text = message.text.body;
    const phoneNumberId = change.metadata.phone_number_id;

    // Build reply payload
    const payload = {
      messaging_product: "whatsapp",
      to: sender,
      type: "text",
      text: { body: `Hello! You said: ${text}` }
    };

    // Send reply via Meta API
    await fetch(`https://graph.facebook.com/v23.0/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    console.log('✅ Reply sent');

  } catch (err) {
    console.error('❌ Error sending reply:', err);
  }

  res.sendStatus(200);
});
