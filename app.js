const express = require('express');

const app = express();
app.use(express.json());

const port = process.env.PORT || 3000;
const verifyToken = process.env.VERIFY_TOKEN;
const whatsappToken = process.env.WHATSAPP_TOKEN;

// GET: webhook verification
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

// POST: receive messages and reply
app.post('/', async (req, res) => {
  const data = req.body;
  console.log('📩 Webhook received:', JSON.stringify(data, null, 2));

  try {
    const entry = data.entry[0];
    const change = entry.changes[0].value;

    if (!change.messages) return res.sendStatus(200);

    const message = change.messages[0];
    const sender = message.from;
    const text = message.text?.body || '';
    const phoneNumberId = change.metadata.phone_number_id;

    const payload = {
      messaging_product: "whatsapp",
      to: sender,
      type: "text",
      text: { body: `Hello! You said: ${text}` }
    };

    // Node 22+ has built-in fetch
    await fetch(`https://graph.facebook.com/v23.0/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${whatsappToken}`,
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

app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});
