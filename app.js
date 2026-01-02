// Import Express.js
const express = require('express');

// Create an Express app
const app = express();

// Middleware to parse JSON bodies
app.use(express.json());

// Environment variables
const port = process.env.PORT || 3000;
const verifyToken = process.env.VERIFY_TOKEN;      // webhook verification
const whatsappToken = process.env.WHATSAPP_TOKEN; // sending messages

// --------------------
// GET: Webhook verification
// --------------------
app.get('/', (req, res) => {
  const mode = req.query['hub.mode'];
  const challenge = req.query['hub.challenge'];
  const verifyTokenFromMeta = req.query['hub.verify_token'];

  if (mode === 'subscribe' && verifyTokenFromMeta === verifyToken) {
    console.log('WEBHOOK VERIFIED');
    res.status(200).send(challenge);
  } else {
    res.status(403).end();
  }
});

// --------------------
// POST: Receive messages
// --------------------
app.post('/', async (req, res) => {
  const data = req.body;
  console.log('\n📩 Webhook received\n');
  console.log(JSON.stringify(data, null, 2));

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

    const url = `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`;

    const payload = {
      messaging_product: "whatsapp",
      to: sender,
      type: "text",
      text: {
        body: `Hello! You said: ${text}`
      }
    };

    await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${whatsappToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    console.log('✅ Reply sent');

  } catch (err) {
    console.error('❌ Error handling message:', err);
  }

  res.sendStatus(200);
});

// --------------------
app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});
