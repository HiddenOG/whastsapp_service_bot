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
app.post('/', (req, res) => {
  const data = req.body;
  const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19);
  console.log(`\n\nWebhook received ${timestamp}\n`);
  console.log(JSON.stringify(data, null, 2));

  try {
    const entry = data.entry[0];
    const messages = entry.changes[0].value.messages;
    const sender = messages[0].from;
    const text = messages[0].text.body;

    // Reply back using Meta API
    const fetch = require('node-fetch');

    const phoneNumberId = entry.changes[0].value.metadata.phone_number_id;
    const token = process.env.WHATSAPP_TOKEN; // create this env variable

    const url = `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`;

    const payload = {
      messaging_product: "whatsapp",
      to: sender,
      type: "text",
      text: { body: `Hello! You said: ${text}` }
    };

    fetch(url, {
      method: 'POST',
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    })
    .then(res => res.text())
    .then(console.log)
    .catch(console.error);

  } catch (e) {
    console.log("Error parsing message:", e);
  }

  res.status(200).end();
});

// Start the server
app.listen(port, () => {
  console.log(`\nListening on port ${port}\n`);
});
